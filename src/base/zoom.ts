import type { Application, Container } from 'pixi.js'
import type useDrag from './drag'
import type usePointer from './pointer'

type ZoomConfig = {
	max: number
	min: number
	speed: number
	default: number
}

export default function useZoom(
	app: Application,
	root: Container,
	config: ZoomConfig,
): {
	value: number
	apply(drag: ReturnType<typeof useDrag>, pointer: ReturnType<typeof usePointer>): void
} {
	let zoom = config.default
	let _drag: ReturnType<typeof useDrag>
	let _pointer: ReturnType<typeof usePointer>

	addEventListener('wheel', (e: WheelEvent) => {
		if (!app.canvas.contains(e.target as Node)) return

		const dir = e.deltaY > 0 ? -1 : 1
		if ((dir < 0 && zoom <= config.min) || (dir > 0 && zoom >= config.max)) return

		zoom *= 1 + config.speed * dir
		// zoom = Math.max(config.min, Math.min(config.max, zoom))
		root.scale = zoom

		root.x -= (_pointer.x - root.x) * config.speed * dir
		root.y -= (_pointer.y - root.y) * config.speed * dir

		_drag.ptrStart = { x: e.clientX, y: e.clientY }
		_drag.rootStart = { x: root.x, y: root.y }
	})

	return {
		get value() {
			return zoom
		},
		apply(drag: ReturnType<typeof useDrag>, pointer: ReturnType<typeof usePointer>) {
			_drag = drag
			_pointer = pointer
		},
	}
}
