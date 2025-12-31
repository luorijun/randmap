export function terrain(height: number) {
	const step = 0.01
	const steps: [number, number, number][] = [
		[0.5, 0x385db8, 0x709afb],
		[0.8, 0x107823, 0xfdd990],
		[1.0, 0xeeeeee, 0xffffff],
	]

	const value = Math.floor(height / step) * step

	// 边界条件
	if (value < 0) {
		return steps[0][1]
	}
	if (value >= steps[steps.length - 1][0]) {
		return steps[steps.length - 1][2]
	}

	// 找到台阶值所在的区间
	for (let i = 0; i < steps.length; i++) {
		const s1 = i === 0 ? 0 : steps[i - 1][0]
		const [s2, color1, color2] = steps[i]

		if (value >= s1 && value < s2) {
			const t = (value - s1) / (s2 - s1)

			const r1 = (color1 >> 16) & 0xff
			const g1 = (color1 >> 8) & 0xff
			const b1 = color1 & 0xff

			const r2 = (color2 >> 16) & 0xff
			const g2 = (color2 >> 8) & 0xff
			const b2 = color2 & 0xff

			const r = Math.round(r1 + (r2 - r1) * t)
			const g = Math.round(g1 + (g2 - g1) * t)
			const b = Math.round(b1 + (b2 - b1) * t)

			return (r << 16) | (g << 8) | b
		}
	}

	return steps[steps.length - 1][2]
}

export function temperature(temp: number): number {
	const value = Math.max(0, Math.min(1, temp))

	const coldColor = 0x3333ff
	const hotColor = 0xff3333

	const r1 = (coldColor >> 16) & 0xff
	const g1 = (coldColor >> 8) & 0xff
	const b1 = coldColor & 0xff

	const r2 = (hotColor >> 16) & 0xff
	const g2 = (hotColor >> 8) & 0xff
	const b2 = hotColor & 0xff

	const r = Math.round(r1 + (r2 - r1) * value)
	const g = Math.round(g1 + (g2 - g1) * value)
	const b = Math.round(b1 + (b2 - b1) * value)

	return (r << 16) | (g << 8) | b
}
