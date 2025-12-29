import { Application, Container } from 'pixi.js'
import { toBase62 } from '@/utils'
import { type Chunk, ChunkTree } from './chunk'

// init
export async function init(draw: HTMLDivElement, debug: HTMLSpanElement, params: HTMLDivElement) {
	const app = new Application()
	await app.init({
		background: '#eee',
		resizeTo: draw,
	})
	draw.appendChild(app.canvas)

	// scene
	const trans = new Container({ label: 'trans' })
	app.stage.addChild(trans)

	const world = new Container({ label: 'world' })
	trans.addChild(world)

	// start
	const size = 256
	const baseOctaves = 8
	const maxLevel = 13

	const center = { x: app.screen.width / 2, y: app.screen.height / 2 }
	const pointer = { x: 0, y: 0 }

	const position = { x: center.x, y: center.y }
	let zoom = (app.screen.height - 40) / size
	let level = -1

	const tree = new ChunkTree(size, world, baseOctaves)

	// zoom
	const zoomSpeed = 0.1
	const zoomMax = 2 ** maxLevel
	const zoomMin = 1
	addEventListener('wheel', (e: WheelEvent) => {
		if (!draw.contains(e.target as Node)) return
		const dir = e.deltaY > 0 ? -1 : 1
		if ((dir < 0 && zoom <= zoomMin) || (dir > 0 && zoom >= zoomMax)) return
		zoom *= 1 + zoomSpeed * dir
		// zoom = Math.max(zoomMin, Math.min(zoomMax, zoom))
		position.x -= (pointer.x - position.x) * zoomSpeed * dir
		position.y -= (pointer.y - position.y) * zoomSpeed * dir
		dragStart = { x: e.clientX, y: e.clientY }
		dragOffset = { x: position.x, y: position.y }
	})

	// drag
	let drag = false
	let dragStart = { x: 0, y: 0 }
	let dragOffset = { x: 0, y: 0 }
	addEventListener('pointerdown', (e: PointerEvent) => {
		if (!draw.contains(e.target as Node)) return
		drag = true
		dragStart = { x: e.clientX, y: e.clientY }
		dragOffset = { x: position.x, y: position.y }
	})
	addEventListener('pointermove', (e: PointerEvent) => {
		pointer.x = e.clientX - draw.offsetLeft
		pointer.y = e.clientY - draw.offsetTop
		if (drag) {
			position.x = dragOffset.x + e.clientX - dragStart.x
			position.y = dragOffset.y + e.clientY - dragStart.y
		}
	})
	addEventListener('pointerup', () => {
		drag = false
	})

	// ticker
	let loadTime = 0
	app.ticker.add(() => {
		const text = `zoom: ${zoom} level: ${Math.max(0, Math.min(maxLevel, Math.floor(Math.log2(zoom))))} count: ${tree.tasks} load: ${loadTime}ms`
		if (debug.innerText !== text) {
			debug.innerText = text
		}

		world.scale.set(zoom)
		trans.position.set(position.x, position.y)

		const time = Date.now()
		level = Math.max(0, Math.min(maxLevel, Math.floor(Math.log2(zoom))))
		if (window.load) {
			tree.load(level, {
				x: (center.x - position.x) / zoom,
				y: (center.y - position.y) / zoom,
				width: app.screen.width / zoom,
				height: app.screen.height / zoom,
			})
			loadTime = Date.now() - time
		}
	})

	// debug
	// declare global {
	//   interface Window {
	//     world: typeof world
	//     root: typeof tree
	//     load: boolean
	//     clear: () => void
	//   }
	// }

	window.root = tree
	window.world = world
	window.load = true
	window.clear = () => {
		tree.root.clear()
	}

	function treeString(chunk: Chunk): string {
		const children = chunk.children.map((child) => treeString(child))
		const lead = ' '.repeat(chunk.level) + '> '
		return `${lead}${chunk.level}: ${toBase62(chunk.id)} ${chunk.status}\n${children.join('')}`
	}

	setInterval(() => {
		const str = treeString(tree.root)
		params.innerHTML = `
      <pre>${str}</pre>
    `
	}, 100)

	let sum = 0
	for (let i = 0; i < 13; i++) {
		sum += 4 ** i
	}
	console.log(sum, (2 ** 14 - 1) ** 2)
}
