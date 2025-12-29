import type { Application, Container } from 'pixi.js'

export default function useDrag(
	app: Application,
	root: Container,
): {
	isDrag: boolean
	ptrStart: { x: number; y: number }
	rootStart: { x: number; y: number }
} {
	let drag = false
	let ptrStart = { x: 0, y: 0 }
	let rootStart = { x: 0, y: 0 }
	document.addEventListener('pointerdown', (e) => {
		if (!app.canvas.contains(e.target as Node)) return
		drag = true
		ptrStart = { x: e.x, y: e.y }
		rootStart = { x: root.x, y: root.y }
	})
	document.addEventListener('pointermove', (e) => {
		if (drag) {
			root.x = rootStart.x + e.x - ptrStart.x
			root.y = rootStart.y + e.y - ptrStart.y
		}
	})
	document.addEventListener('pointerup', () => {
		drag = false
	})

	return {
		get isDrag() {
			return drag
		},
		get ptrStart() {
			return ptrStart
		},
		set ptrStart(value) {
			ptrStart = value
		},
		get rootStart() {
			return rootStart
		},
		set rootStart(value) {
			rootStart = value
		},
	}
}
