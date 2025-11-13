import { Container, Graphics, Sprite, Texture, type PointData, type RectangleLike } from 'pixi.js'
import { wrap } from 'comlink'
import type { NoiseWorker } from '@/workers/noise'

const batchBuffer = new SharedArrayBuffer(2)
const countBuffer = new SharedArrayBuffer(4)
const noise = wrap<NoiseWorker>(new Worker(new URL('@/workers/noise.ts', import.meta.url), { type: 'module' }))
noise.buf(batchBuffer, countBuffer)

type GenCallback = (buffer: SharedArrayBuffer | null) => void
const queue: [Chunk, GenCallback][] = []

class ChunkTree {
  world: Container
  root: Chunk
  size: number
  baseOctaves: number
  debug: boolean

  private _batch: Int16Array

  private get batch() {
    return this._batch[0]
  }

  private set batch(value: number) {
    this._batch[0] = value
  }

  private _tasks: Int32Array

  get tasks() {
    return this._tasks[0]
  }

  constructor(size: number, world: Container, baseOctaves: number = 8, debug?: boolean) {
    this.size = size
    this.world = world
    this.root = new Chunk(this, size)
    this.baseOctaves = baseOctaves
    this.debug = debug || false
    this._batch = new Int16Array(batchBuffer)
    this._tasks = new Int32Array(countBuffer)
  }

  load(level: number, viewer: RectangleLike) {
    this.root.load(level, viewer)
    if (!queue.length) return

    this.batch++
    while (true) {
      const item = queue.shift()
      if (!item) break
      const [chunk, callback] = item
      noise.set({ octaves: this.baseOctaves + chunk.level })
      noise.gen(this.batch, chunk.pos, chunk.size, this.size).then(callback)
    }
  }
}

class Chunk {
  root: ChunkTree
  parent?: Chunk
  quadrant?: number
  x: number
  y: number
  size: number
  level: number
  children: Chunk[]
  status: 'init' | 'clear' | 'divide' | 'render' | 'done'
  sprite: Sprite
  rect?: Graphics

  get pos(): PointData {
    return { x: this.x, y: this.y }
  }

  constructor(tree: ChunkTree, props: number | {
    parent: Chunk
    quadrant: number
  }) {
    this.root = tree

    switch (typeof props) {
      case 'number':
        this.x = 0
        this.y = 0
        this.size = props
        this.level = 0
        break
      case 'object':
        this.parent = props.parent
        this.quadrant = props.quadrant
        this.x = this.parent.x + this.parent.size / 4 * (this.quadrant & 2 ? -1 : 1)
        this.y = this.parent.y + this.parent.size / 4 * (this.quadrant <= 2 ? 1 : -1)
        this.size = props.parent.size / 2
        this.level = this.parent.level + 1
        break
    }

    this.children = []
    this.status = 'init'

    this.sprite = new Sprite({ pivot: this.size / 2 })
    this.sprite.position = { x: this.pos.x, y: this.pos.y }
    this.sprite.setSize(1 / 2 ** this.level)
    this.sprite.pivot.set(this.root.size / 2)
    this.root.world.addChild(this.sprite)

    if (this.root.debug) {
      this.rect = new Graphics().rect(this.pos.x, this.pos.y, this.size, this.size)
      this.rect.pivot.set(this.size / 2)
      this.root.world.addChild(this.rect)
    }
  }

  load(level: number, rect: RectangleLike) {
    // clear
    const xVisible = Math.abs(rect.x - this.pos.x) * 2 <= rect.width + this.size
    const yVisible = Math.abs(rect.y - this.pos.y) * 2 <= rect.height + this.size
    if (!xVisible || !yVisible) {
      this.clear()
      return
    }

    // divide
    if (level > this.level) {
      this.divide(level, rect)
      return
    }

    // render
    this.render()
  }

  clear() {
    if (this.status === 'clear') return
    this.destroyChildren()
    this.hiddenSelf()
    this.status = 'clear'
  }

  divide(level: number, rect: RectangleLike) {
    this.loadChildren(level, rect)
    this.status = 'divide'
  }

  render() {
    if (this.status === 'render' || this.status === 'done') return
    noise.set({ octaves: this.root.baseOctaves + this.level })
    queue.push([this, (buffer) => {
      if (!buffer) return

      this.sprite.texture = Texture.from({
        resource: new Uint8Array(buffer),
        width: this.root.size,
        height: this.root.size,
        scaleMode: 'nearest',
      })
      this.rect?.clear()
        .rect(this.pos.x, this.pos.y, this.size, this.size)
        .fill({ color: 'green', alpha: 0.2 })

      this.destroyChildren()

      this.status = 'done'
      if (this.parent && this.parent.children.every(child => child.status === 'done')) {
        this.parent.hiddenSelf()
      }
    }])
    this.status = 'render'
  }

  hiddenSelf() {
    this.sprite.texture = Texture.EMPTY
    this.rect?.clear()
      .rect(this.pos.x, this.pos.y, this.size, this.size)
      .fill({ color: 'red', alpha: 0.2 })
  }

  loadChildren(level: number, rect: RectangleLike) {
    if (!this.children.length) {
      this.children[0] = new Chunk(this.root, { parent: this, quadrant: 1 })
      this.children[1] = new Chunk(this.root, { parent: this, quadrant: 2 })
      this.children[2] = new Chunk(this.root, { parent: this, quadrant: 3 })
      this.children[3] = new Chunk(this.root, { parent: this, quadrant: 4 })
    }
    this.children[0].load(level, rect)
    this.children[1].load(level, rect)
    this.children[2].load(level, rect)
    this.children[3].load(level, rect)
  }

  destroyChildren() {
    this.children.forEach((child) => {
      child.sprite.destroy(true)
      this.root.world.removeChild(child.sprite)

      if (child.rect) {
        child.rect.destroy(true)
        this.root.world.removeChild(child.rect)
      }

      child.destroyChildren()
    })
    this.children = []
  }
}

export { ChunkTree, Chunk }
