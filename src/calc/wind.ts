import { rotate, type vec2 } from '@/base'
import { height, rotation } from '@/voronoi'

export type Wind = {
	direction: vec2
	speed: number
}

export function wind(x: number, y: number): Wind {
	const base = windBase(y)
	return base
}

function windBase(y: number) {
	const lat = y / (height / 2)
	const speed = (Math.cos(3 * Math.PI * lat) + 1) / 2
	const dir = -Math.sign(Math.sin(3 * Math.PI * lat))
	return {
		direction: rotate(0, dir, rotation * -Math.sign(lat)),
		speed: speed,
	}
}

// function windTemp() {
// 	const node = null
// 	for (niber of node.nibers) {
// 		if (node.temp < niber.temp) {
// 			const vec = [niber.x - node.x, niber.y - node.y]
// 		}
// 	}
// }
