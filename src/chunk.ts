import { Container, Sprite, Texture } from 'pixi.js'
import { wrap } from 'comlink'
import type { NoiseWorker } from '@/workers/noise'

const batchBuffer = new SharedArrayBuffer(2)
const noise = wrap<NoiseWorker>(new Worker(new URL('@/workers/noise.ts', import.meta.url), { type: 'module' }))
noise.buf(batchBuffer)

class ChunkTree {
  world: Container
  root: Chunk
  size: number
  baseOctaves: number

  private _batch: Int16Array

  get batch() {
    return this._batch[0]
  }

  set batch(value: number) {
    this._batch[0] = value
  }

  constructor(size: number, world: Container, baseOctaves: number = 8) {
    this.size = size
    this.world = world
    this.root = new Chunk(this, size)
    this._batch = new Int16Array(batchBuffer)
    this.baseOctaves = baseOctaves
  }

  load(level: number) {
    this.batch = (this.batch + 1) % 65536
    return this.root.load(level, this.batch)
  }
}

class Chunk {
  root: ChunkTree
  parent?: Chunk
  quadrant?: number
  children: Chunk[]
  size: number
  level: number

  sprite: Sprite

  get chunk(): { x: number, y: number, size: number, sample: number } {
    if (!this.parent || !this.quadrant) {
      return { x: 0, y: 0, size: this.size, sample: this.root.size }
    }
    const { x, y, size } = this.parent.chunk
    return {
      x: (x + size / 4) * (this.quadrant & 2 ? -1 : 1),
      y: (y + size / 4) * (this.quadrant <= 2 ? -1 : 1),
      size: size / 2,
      sample: this.root.size,
    }
  }

  constructor(tree: ChunkTree, props: number | {
    parent: Chunk
    quadrant: number
  }) {
    this.root = tree

    switch (typeof props) {
      case 'number':
        this.size = props
        this.level = 0
        break
      case 'object':
        this.parent = props.parent
        this.quadrant = props.quadrant
        this.size = props.parent.size / 2
        this.level = this.parent.level + 1
        break
    }

    this.children = []

    this.sprite = new Sprite({ pivot: this.chunk.size / 2 })
    this.sprite.position = { x: this.chunk.x, y: this.chunk.y }
    this.sprite.setSize(1 / Math.pow(2, this.level))
    this.sprite.pivot.set(this.root.size / 2)
    this.root.world.addChild(this.sprite)

    // const rect = new Graphics().rect(this.chunk.x, this.chunk.y, this.chunk.size, this.chunk.size).fill({ color: 'green', alpha: 0.2 })
    // rect.pivot.set(this.chunk.size / 2)
    // world.addChild(rect)
  }

  destroy() {
    this.sprite.destroy(true)
    this.root.world.removeChild(this.sprite)
    this.children.forEach(child => child.destroy())
  }

  async load(currLevel: number, currBatch: number) {
    if (currBatch !== this.root.batch) return

    if (currLevel > this.level) {
      if (!this.children.length) {
        this.children = [
          new Chunk(this.root, { parent: this, quadrant: 1 }),
          new Chunk(this.root, { parent: this, quadrant: 2 }),
          new Chunk(this.root, { parent: this, quadrant: 3 }),
          new Chunk(this.root, { parent: this, quadrant: 4 }),
        ]
      }
      await Promise.all([
        this.children[0]?.load(currLevel, currBatch),
        this.children[1]?.load(currLevel, currBatch),
        this.children[2]?.load(currLevel, currBatch),
        this.children[3]?.load(currLevel, currBatch),
      ])
      this.sprite.texture = Texture.EMPTY
    }

    else if (currLevel === this.level) {
      noise.set({ octaves: this.root.baseOctaves + currLevel })
      const buffer = await noise.gen(this.chunk, this.root.batch)
      if (!buffer) return

      this.sprite.texture = Texture.from({
        resource: new Uint8Array(buffer),
        width: this.root.size,
        height: this.root.size,
        scaleMode: 'nearest',
      })

      // 清除子节点
      this.children.forEach(child => child.destroy())
      this.children = []
    }
  }
}

export { ChunkTree, Chunk }
