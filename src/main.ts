import '@/style.css'
import { Application, Sprite, Texture } from 'pixi.js'
import { wrap } from 'comlink'
import type { Api } from './workers/noise'

// app
const el = document.querySelector('#map') as HTMLElement
const app = new Application()
await app.init({
  background: '#eee',
  resizeTo: el,
})
el.appendChild(app.canvas)

// noise
const width = app.canvas.width
const height = app.canvas.height
const noise: Api = wrap(new Worker(new URL('./workers/noise.ts', import.meta.url), { type: 'module' }))
await noise.set({ width, height })

// show
const coord = { x: 0, y: 0 }
const data = await noise.gen(coord)

const texture = Texture.from({
  resource: new Uint8Array(data),
  width: width,
  height: height,
})

const sprite = new Sprite(texture)
app.stage.addChild(sprite)
