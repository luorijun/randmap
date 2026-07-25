import { height } from '@/voronoi/constants'

type HumidityNode = {
	x: number
	y: number
	height: number
	humidity: number
}

const seaLevel = 0.5
const directionSharpness = 2
const transportLossRate = 0.05
const upliftFactor = 2
const epsilon = 1e-4
const inverseSqrt2 = 1 / Math.sqrt(2)

export function calculateHumidity(nodes: HumidityNode[], neighborsOf: (index: number) => Iterable<number>): number {
	const moisture = new Float32Array(nodes.length)
	const queued = new Uint8Array(nodes.length)
	const queue: number[] = []
	let head = 0

	const enqueue = (index: number) => {
		if (queued[index] === 0 && moisture[index] > epsilon) {
			queued[index] = 1
			queue.push(index)
		}
	}

	for (let i = 0; i < nodes.length; i++) {
		nodes[i].humidity = 0
		if (nodes[i].height < seaLevel) {
			moisture[i] = 1
			enqueue(i)
		}
	}

	// transportLossRate must stay > 0. If it is 0, transport cycles can keep
	// moisture circulating and the queue may not converge.
	while (head < queue.length) {
		const i = queue[head++]
		const current = nodes[i]
		queued[i] = 0

		const amount = moisture[i]
		moisture[i] = 0

		if (amount <= epsilon) continue

		const downstream: { index: number; weight: number }[] = []
		let totalWeight = 0
		const direction = moistureDirection(current.y)

		for (const n of neighborsOf(i)) {
			const neighbor = nodes[n]
			const dx = neighbor.x - current.x
			const dy = neighbor.y - current.y
			const length = Math.hypot(dx, dy)
			if (length === 0) continue

			const dot = (dx / length) * direction[0] + (dy / length) * direction[1]
			if (dot <= 0) continue

			const weight = dot ** directionSharpness
			totalWeight += weight
			downstream.push({ index: n, weight })
		}

		if (downstream.length === 0 || totalWeight === 0) {
			current.humidity += amount
			continue
		}

		for (const { index: n, weight } of downstream) {
			const next = nodes[n]
			const share = amount * (weight / totalWeight)

			const terrainPassRate = exponentialTerrainPassRate(current.height, next.height)
			const terrainHumidity = share * (1 - terrainPassRate)

			const transportable = share * terrainPassRate
			const transportHumidity = transportable * transportLossRate
			const delivered = transportable - transportHumidity

			current.humidity += terrainHumidity + transportHumidity
			moisture[n] += delivered
			enqueue(n)
		}
	}

	let maxHumidity = 0
	for (const node of nodes) {
		if (node.height >= seaLevel && node.humidity > maxHumidity) maxHumidity = node.humidity
	}

	return maxHumidity
}

export function linearTerrainPassRate(currentHeight: number, nextHeight: number): number {
	const current = Math.min(1, Math.max(currentHeight, seaLevel))
	const next = Math.min(1, Math.max(nextHeight, seaLevel))

	if (next <= current) return 1

	return (1 - next) / (1 - current)
}

export function exponentialTerrainPassRate(currentHeight: number, nextHeight: number): number {
	const heightGain = Math.max(0, Math.max(nextHeight, seaLevel) - Math.max(currentHeight, seaLevel))
	return Math.exp(-upliftFactor * heightGain)
}

export function moistureDirection(y: number): [number, number] {
	const lat = Math.abs(y / (height / 2))
	const hemisphere = y < 0 ? -1 : 1
	const isWesterlies = lat >= 1 / 3 && lat < 2 / 3

	return isWesterlies ? [inverseSqrt2, hemisphere * inverseSqrt2] : [-inverseSqrt2, -hemisphere * inverseSqrt2]
}
