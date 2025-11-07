import '@/style.css'
import { Application, Sprite, Texture } from 'pixi.js'
import { wrap } from 'comlink'
import type { NoiseWorker } from './workers/noise'

// init
const el = document.querySelector('#map') as HTMLDivElement
const debug = el.querySelector('#debug') as HTMLSpanElement

const app = new Application()
await app.init({
  background: '#eee',
  resizeTo: el,
})
el.appendChild(app.canvas)

// start
const chunk = { x: 0, y: 0 }
const size = 64
const maxLevel = 17
const minOctaves = 2

const position = { x: 0, y: 0 }
let zoom = 10
let level = 0

// scene
const sprite = new Sprite()
app.stage.addChild(sprite)

// noise
const noise = wrap<NoiseWorker>(new Worker(new URL('./workers/noise.ts', import.meta.url), { type: 'module' }))
noise.set({ size: { width: size, height: size } })

// zoom
const zoomSpeed = 0.1
const zoomMax = Math.pow(2, maxLevel)
const zoomMin = 10
addEventListener('wheel', (e: WheelEvent) => {
  const dir = e.deltaY > 0 ? -1 : 1
  zoom += zoom * zoomSpeed * dir
  zoom = Math.max(zoomMin, Math.min(zoomMax, zoom))
})

// drag
let drag = false
let dragStart = { x: 0, y: 0 }
let dragOffset = { x: 0, y: 0 }
addEventListener('pointerdown', (e: PointerEvent) => {
  drag = true
  dragStart = { x: e.clientX, y: e.clientY }
  dragOffset = { x: position.x, y: position.y }
})
addEventListener('pointermove', (e: PointerEvent) => {
  if (drag) {
    position.x = dragOffset.x + e.clientX - dragStart.x
    position.y = dragOffset.y + e.clientY - dragStart.y
  }
})
addEventListener('pointerup', () => {
  drag = false
})

// ticker
app.ticker.add(() => {
  debug.innerText = `FPS: ${Math.round(app.ticker.FPS)} zoom: ${zoom} level: ${level}`

  app.stage.scale.set(zoom)
  app.stage.position.set(position.x, position.y)

  updateQTree()
})

// 每次变换触发更新，更新时需要标记，直到上次更新完再接受下次更新
//   - 考虑实现可撤销过时更新

let gen = false
function updateQTree() {
  const currLevel = Math.max(0, Math.min(maxLevel, Math.floor(Math.log2(zoom))))
  if (!gen && currLevel !== level) {
    gen = true
    noise.set({ noise: { octaves: minOctaves + currLevel } })
    noise.gen(chunk).then((buffer) => {
      sprite.texture = Texture.from({
        resource: new Uint8Array(buffer),
        width: size,
        height: size,
        scaleMode: 'nearest',
      })
      gen = false
    })
  }
  level = currLevel
}
