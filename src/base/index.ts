export type vec2 = [number, number]

export function rotate(x: number, y: number, angle: number): vec2 {
	const cos = Math.cos(angle)
	const sin = Math.sin(angle)
	return [x * cos - y * sin, x * sin + y * cos]
}
