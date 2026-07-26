export type BiomeId =
	| 'deepOcean'
	| 'shallowOcean'
	| 'iceSheet'
	| 'tundra'
	| 'taiga'
	| 'temperateForest'
	| 'temperateRainforest'
	| 'grassland'
	| 'shrubland'
	| 'subtropicalDesert'
	| 'savanna'
	| 'tropicalSeasonalForest'
	| 'tropicalRainforest'
	| 'alpine'

export type BiomeInput = {
	height: number
	temperature: number
	humidity: number
}

const seaLevel = 0.5
const shallowOceanLevel = 0.45
const alpineLevel = 0.8
const iceSheetLevel = 0.9
const moistureContrast = 20

export function calculateBiome(node: BiomeInput, maxHumidity: number): BiomeId {
	if (node.height < seaLevel) {
		return node.height < shallowOceanLevel ? 'deepOcean' : 'shallowOcean'
	}

	const temperature = node.temperature
	const moisture = normalizeMoisture(node.humidity, maxHumidity)

	if (temperature <= -20 || node.height >= iceSheetLevel) return 'iceSheet'
	if (node.height >= alpineLevel) return 'alpine'
	if (temperature <= -4) return 'tundra'
	if (temperature <= 6) return moisture < 0.35 ? 'tundra' : 'taiga'

	if (temperature <= 18) {
		if (moisture < 0.16) return 'subtropicalDesert'
		if (moisture < 0.34) return 'shrubland'
		if (moisture < 0.58) return 'grassland'
		if (moisture < 0.82) return 'temperateForest'
		return 'temperateRainforest'
	}

	if (moisture < 0.18) return 'subtropicalDesert'
	if (moisture < 0.36) return 'savanna'
	if (moisture < 0.62) return 'tropicalSeasonalForest'
	return 'tropicalRainforest'
}

export function biomeName(id: BiomeId): string {
	switch (id) {
		case 'deepOcean':
			return 'Deep Ocean'
		case 'shallowOcean':
			return 'Shallow Ocean'
		case 'iceSheet':
			return 'Ice Sheet'
		case 'tundra':
			return 'Tundra'
		case 'taiga':
			return 'Taiga'
		case 'temperateForest':
			return 'Temperate Forest'
		case 'temperateRainforest':
			return 'Temperate Rainforest'
		case 'grassland':
			return 'Grassland'
		case 'shrubland':
			return 'Shrubland'
		case 'subtropicalDesert':
			return 'Subtropical Desert'
		case 'savanna':
			return 'Savanna'
		case 'tropicalSeasonalForest':
			return 'Tropical Seasonal Forest'
		case 'tropicalRainforest':
			return 'Tropical Rainforest'
		case 'alpine':
			return 'Alpine'
	}
}

export function biomeAbbreviation(id: BiomeId): string {
	switch (id) {
		case 'deepOcean':
			return 'DPO'
		case 'shallowOcean':
			return 'SHO'
		case 'iceSheet':
			return 'ICE'
		case 'tundra':
			return 'TUN'
		case 'taiga':
			return 'TAI'
		case 'temperateForest':
			return 'TEF'
		case 'temperateRainforest':
			return 'TMR'
		case 'grassland':
			return 'GRS'
		case 'shrubland':
			return 'SHR'
		case 'subtropicalDesert':
			return 'DES'
		case 'savanna':
			return 'SAV'
		case 'tropicalSeasonalForest':
			return 'TSF'
		case 'tropicalRainforest':
			return 'TRF'
		case 'alpine':
			return 'ALP'
	}
}

function normalizeMoisture(humidity: number, maxHumidity: number): number {
	const ratio = maxHumidity > 0 ? Math.max(0, Math.min(1, humidity / maxHumidity)) : 0
	return Math.log1p(ratio * moistureContrast) / Math.log1p(moistureContrast)
}
