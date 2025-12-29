import type { Application } from 'pixi.js'

export default function usePointer(_: Application): {
	x: number
	y: number
} {
	const pointer = { x: 0, y: 0 }
	document.addEventListener('pointermove', (e) => {
		pointer.x = e.x - 256
		pointer.y = e.y - 64
	})
	return pointer
}
