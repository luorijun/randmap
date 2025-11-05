import '@/style.css'
import { Application, Graphics, Sprite, Texture } from 'pixi.js'
import { wrap } from 'comlink'
import type { NoiseWorker } from './workers/noise'

// app
const el = document.querySelector('#map') as HTMLDivElement
const debug = el.querySelector('#debug') as HTMLSpanElement

const app = new Application()
await app.init({
  background: '#eee',
  resizeTo: el,
})
el.appendChild(app.canvas)

// noise
const width = app.canvas.width
const height = app.canvas.height
const noise = wrap<NoiseWorker>(new Worker(new URL('./workers/noise.ts', import.meta.url), { type: 'module' }))
await noise.set({ width, height })

// show
const chunk = { x: 0, y: 0 }
const data = await noise.gen(chunk)

const texture = Texture.from({
  resource: new Uint8Array(data),
  width: width,
  height: height,
  scaleMode: 'nearest',
})

const sprite = new Sprite(texture)
app.stage.addChild(sprite)

// zoom
let zoom = 1
const zoomSpeed = 0.1
addEventListener('wheel', (e: WheelEvent) => {
  const dir = e.deltaY > 0 ? -1 : 1
  zoom += zoom * zoomSpeed * dir
  zoom = Math.max(0.5, Math.min(5, zoom))
  sprite.scale.set(zoom)
})

// drag
let drag = false
let dragStart = { x: 0, y: 0 }
let dragOffset = { x: 0, y: 0 }
addEventListener('pointerdown', (e: PointerEvent) => {
  drag = true
  dragStart = { x: e.clientX, y: e.clientY }
  dragOffset = { x: sprite.x, y: sprite.y }
})
addEventListener('pointermove', (e: PointerEvent) => {
  if (drag) {
    sprite.x = dragOffset.x + e.clientX - dragStart.x
    sprite.y = dragOffset.y + e.clientY - dragStart.y
  }
})
addEventListener('pointerup', () => {
  drag = false
})

const debugLine = new Graphics()
app.stage.addChild(debugLine)

// ticker
app.ticker.add(() => {
  debug.innerText = `FPS: ${Math.round(app.ticker.FPS)}`
})
