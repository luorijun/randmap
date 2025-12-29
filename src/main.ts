import '@/style.css'
import { Application } from 'pixi.js'
import { init } from './voronoi'

const root = document.getElementById('map') as HTMLDivElement
const app = new Application()
await app.init({
	background: '#eee',
	resizeTo: root,
	antialias: true,
	preference: 'webgpu',
})
root.appendChild(app.canvas)

init(app)
