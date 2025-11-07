import '@/style.css'
import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js'
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
const size = 256
const maxLevel = 13
const minOctaves = 8

const center = { x: app.screen.width / 2, y: app.screen.height / 2 }
const pointer = { x: 0, y: 0 }

let level = -1
let zoom = (app.screen.height - 40) / size
const position = { x: center.x, y: center.y }

// scene
const world = new Container()
app.stage.addChild(world)
const sprite = new Sprite({ pivot: size / 2 })
world.addChild(sprite)

// noise
const noise = wrap<NoiseWorker>(new Worker(new URL('./workers/noise.ts', import.meta.url), { type: 'module' }))
noise.set({ size: { width: size, height: size } })

// zoom
const zoomSpeed = 0.1
const zoomMax = Math.pow(2, maxLevel)
const zoomMin = 1
addEventListener('wheel', (e: WheelEvent) => {
  const dir = e.deltaY > 0 ? -1 : 1
  if ((dir < 0 && zoom <= zoomMin) || (dir > 0 && zoom >= zoomMax)) return
  zoom *= (1 + zoomSpeed * dir)
  zoom = Math.max(zoomMin, Math.min(zoomMax, zoom))
  position.x -= (pointer.x - world.x) * zoomSpeed * dir
  position.y -= (pointer.y - world.y) * zoomSpeed * dir
  dragStart = { x: e.clientX, y: e.clientY }
  dragOffset = { x: position.x, y: position.y }
})

// drag
let drag = false
let dragStart = { x: 0, y: 0 }
let dragOffset = { x: 0, y: 0 }
addEventListener('pointerdown', (e: PointerEvent) => {
  if (!el.contains(e.target as Node)) return
  drag = true
  dragStart = { x: e.clientX, y: e.clientY }
  dragOffset = { x: position.x, y: position.y }
})
addEventListener('pointermove', (e: PointerEvent) => {
  pointer.x = e.clientX - el.offsetLeft
  pointer.y = e.clientY - el.offsetTop
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
  const text = `zoom: ${zoom} level: ${level} octaves: ${minOctaves + level} length: ${Math.pow(2, level) * 256}`
  if (debug.innerText != text) {
    debug.innerText = text
  }

  world.scale.set(zoom)
  world.position.set(position.x, position.y)

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
