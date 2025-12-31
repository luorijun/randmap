import { type Application, Bounds, type Container } from 'pixi.js'

export function useInput(
	app: Application,
	root: Container,
	config: {
		zoom: {
			max: number
			min: number
			speed: number
			default: number
		}
	},
) {
	const data = {
		drag: false,
		ptrStart: { x: 0, y: 0 },
		rootStart: { x: 0, y: 0 },
		zoom: config.zoom.default,
		pointer: { x: 0, y: 0 },
		viewport: new Bounds(),
	}

	// drag
	document.addEventListener('pointerdown', (e) => {
		if (!app.canvas.contains(e.target as Node)) return
		data.drag = true
		data.ptrStart = { x: e.x, y: e.y }
		data.rootStart = { x: root.x, y: root.y }
	})
	document.addEventListener('pointermove', (e) => {
		data.pointer.x = e.x - 256
		data.pointer.y = e.y - 64

		if (data.drag) {
			root.x = data.rootStart.x + e.x - data.ptrStart.x
			root.y = data.rootStart.y + e.y - data.ptrStart.y
		}
	})
	document.addEventListener('pointerup', () => {
		data.drag = false
	})

	// zoom
	addEventListener('wheel', (e: WheelEvent) => {
		if (!app.canvas.contains(e.target as Node)) return

		const dir = e.deltaY > 0 ? -1 : 1
		if ((dir < 0 && data.zoom <= config.zoom.min) || (dir > 0 && data.zoom >= config.zoom.max)) return

		data.zoom *= 1 + config.zoom.speed * dir
		// zoom = Math.max(config.min, Math.min(config.max, zoom))
		root.scale = data.zoom

		root.x -= (data.pointer.x - root.x) * config.zoom.speed * dir
		root.y -= (data.pointer.y - root.y) * config.zoom.speed * dir

		data.ptrStart = { x: e.clientX, y: e.clientY }
		data.rootStart = { x: root.x, y: root.y }
	})

	// viewport
	app.ticker.add(() => {
		data.viewport.x = -root.x / data.zoom
		data.viewport.y = -root.y / data.zoom
		data.viewport.width = app.screen.width / data.zoom
		data.viewport.height = app.screen.height / data.zoom
	})

	return data
}
