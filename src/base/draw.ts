import type { BiomeId } from '@/calc/biome'

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

export function biome(id: BiomeId): number {
	switch (id) {
		case 'deepOcean':
			return 0x15366f
		case 'shallowOcean':
			return 0x2f6fad
		case 'iceSheet':
			return 0xf3f7fb
		case 'tundra':
			return 0xb7bba1
		case 'taiga':
			return 0x416b4f
		case 'temperateForest':
			return 0x2f7d45
		case 'temperateRainforest':
			return 0x1f6f61
		case 'grassland':
			return 0xb6bd55
		case 'shrubland':
			return 0xc29f57
		case 'subtropicalDesert':
			return 0xe2c16f
		case 'savanna':
			return 0xc9ad46
		case 'tropicalSeasonalForest':
			return 0x48924f
		case 'tropicalRainforest':
			return 0x136b3a
		case 'alpine':
			return 0x8a8f85
	}
}

export function inland(curr: number, max: number): string {
	const value = Math.max(0, Math.min(1, curr / max))
	return `hsl(215 100% ${value * 50 + 50}%)`
}

export function humidity(curr: number, max: number): number {
	const ratio = max > 0 ? Math.max(0, Math.min(1, curr / max)) : 0
	const contrast = 20
	const value = Math.log1p(ratio * contrast) / Math.log1p(contrast)
	return interpolate(0xd8b84f, 0x2f7ed8, value)
}

function interpolate(color1: number, color2: number, value: number): number {
	const r1 = (color1 >> 16) & 0xff
	const g1 = (color1 >> 8) & 0xff
	const b1 = color1 & 0xff

	const r2 = (color2 >> 16) & 0xff
	const g2 = (color2 >> 8) & 0xff
	const b2 = color2 & 0xff

	const r = Math.round(r1 + (r2 - r1) * value)
	const g = Math.round(g1 + (g2 - g1) * value)
	const b = Math.round(b1 + (b2 - b1) * value)

	return (r << 16) | (g << 8) | b
}
