import { Delaunay, randomLcg, type Voronoi } from 'd3'
// @ts-expect-error qaq
import FastNoiseLite from 'fastnoise-lite'
import { type Application, Container, Graphics, Text } from 'pixi.js'
import PoissonDiskSampling from 'poisson-disk-sampling'
import { proxy } from 'valtio/vanilla'
import { watch } from 'valtio/vanilla/utils'
import { inland, temperature, terrain } from '@/base/draw'
import { useInput } from '@/base/input'

let app: Application
export async function init(pixiApp: Application) {
	app = pixiApp
	start()
	app.ticker.add(update)
}

type Node = {
	x: number
	y: number
	color: number
	height: number
	temperature: number
	inland: number
	wind: number
	polar: number
	tile: Graphics
	text: Text
}

// 常量
const width = 4000
const height = 2000

const tileSeed = 9856
const random = randomLcg(tileSeed)

const noiseSeed = 9856
const noise = new FastNoiseLite(noiseSeed)
noise.SetNoiseType(FastNoiseLite.NoiseType.Perlin)
noise.SetFrequency(2.5)
noise.SetFractalType(FastNoiseLite.FractalType.FBm)
noise.SetFractalLacunarity(2.0)
noise.SetFractalGain(0.5)
noise.SetFractalOctaves(8)

const tempMax = 30
const tempMin = -20
const tempStep = 6.5

// 变量
let world: Container
let tiles: Container
let lines: Container
let texts: Container

const debug = document.getElementById('debug') as HTMLSpanElement

let input: ReturnType<typeof useInput>
export const data = proxy<{
	mode: 'line' | 'area'
	view: 'cid' | 'height' | 'terrain' | 'temperature' | 'inland' | 'wind'
}>({
	mode: 'area',
	view: 'terrain',
})

let delaunay: Delaunay<Node>
let voronoi: Voronoi<Node>
let nodes: Node[] = []
let maxInland = 0

function start() {
	world = new Container({
		parent: app.stage,
		x: app.screen.width / 2,
		y: app.screen.height / 2,
		scale: 0.35,
		eventMode: 'none',
	})

	tiles = new Container({ parent: world })
	lines = new Container({ parent: world })
	texts = new Container({ parent: world })

	input = useInput(app, world, {
		zoom: {
			speed: 0.1,
			max: 5,
			min: 0.35,
			default: 0.35,
		},
	})

	const time = performance.now()

	// init points
	nodes = new PoissonDiskSampling({ shape: [width, height], minDistance: 10 }, random)
		.fill()
		.map(p => ({ x: p[0] - width / 2, y: p[1] - height / 2 }) as Node)

	console.log('points', nodes.length, `${performance.now() - time}ms`)

	// init voronoi
	const hw = width / 2
	const hh = height / 2
	delaunay = Delaunay.from(
		nodes,
		d => d.x,
		d => d.y,
	)
	voronoi = delaunay.voronoi([-hw, -hh, hw, hh])

	console.log('voronoi', `${performance.now() - time}ms`)

	// calc data
	const scanQueue: [number, Node][] = []
	nodes.forEach((node, i) => {
		// cid
		node.color = (i * 7821629) % 2 ** 24

		// height
		const max = Math.max(width, height)
		node.height = (noise.GetNoise(node.x / max, node.y / max) + 1) * 0.5

		// temperature
		const tempBase = tempMax - (tempMax - tempMin) * Math.abs(node.y / (height / 2))
		const tempValue = tempBase - tempStep * Math.max(0, node.height - 0.5) * 20 // .5 映射到 10000
		node.temperature = tempValue

		// inland
		if (node.height >= 0.5) {
			node.inland = Infinity
		} else {
			node.inland = 0
			scanQueue.push([i, node])
		}
	})

	console.log('data', `${performance.now() - time}ms`)

	// calc sdf
	while (scanQueue.length > 0) {
		const el = scanQueue.shift()
		if (!el) break

		const [i, node] = el
		const neighbors = voronoi.neighbors(i)
		for (const n of neighbors) {
			const neighbor = nodes[n]
			if (neighbor.height >= 0.5 && neighbor.inland > node.inland + 1) {
				neighbor.inland = node.inland + 1
				if (neighbor.inland > maxInland) maxInland = neighbor.inland
				scanQueue.push([n, neighbor])
			}
		}
	}

	console.log('sdf', `${performance.now() - time}ms`)

	// draw
	drawTile(data.view)
	watch(get => {
		const view = get(data).view
		onChange(view)
	})
}

function update() {
	debug.innerText = `${app.ticker.deltaMS.toFixed(2)} zoom: ${input.zoom.toFixed(2)}`

	texts.children.forEach(child => {
		child.scale = 1 / input.zoom
		child.renderable = input.zoom >= 2 && input.viewport.containsPoint(child.x, child.y)
		// child.renderable = false
	})
}

function drawTile(view: typeof data.view) {
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i]
		const polygon = voronoi.cellPolygon(i)
		const neighbors = voronoi.neighbors(i)

		node.tile = new Graphics({
			parent: tiles,
		})
			.poly(polygon.flat(), true)
			.fill(0xffffff)

		node.text = new Text({
			parent: texts,
			position: { x: node.x, y: node.y },
			style: { fontSize: 12 },
			anchor: 0.5,
		})

		let minTempDiff = Infinity
		let maxTempNeighbor: Node | null = null
		for (const n of neighbors) {
			const neighbor = nodes[n]
			const tempDiff = node.temperature - neighbor.temperature
			if (tempDiff < minTempDiff) {
				minTempDiff = tempDiff
				maxTempNeighbor = neighbor
			}
		}
		if (minTempDiff < 0 && maxTempNeighbor) {
			const width = -minTempDiff
			const line = new Graphics({
				parent: lines,
			})
				.moveTo(node.x, node.y)
				.lineTo(maxTempNeighbor.x, maxTempNeighbor.y)
				.stroke({ width, color: 0xff3333 })
			const arrow = new Graphics({
				parent: line,
				x: maxTempNeighbor.x,
				y: maxTempNeighbor.y,
				rotation: Math.atan2(maxTempNeighbor.y - node.y, maxTempNeighbor.x - node.x),
			})
				.moveTo(0, 0)
				.lineTo(-2 * width * 2, -1 * width * 2)
				.lineTo(-2 * width * 2, 1 * width * 2)
				.closePath()
				.fill(0xff3333)
			// arrow.rotation = Math.atan2(maxTempNeighbor.y - node.y, maxTempNeighbor.x - node.x) + Math.PI / 2
		}
	}

	tiles.cacheAsTexture({
		antialias: false,
		scaleMode: 'nearest',
	})
}

function onChange(view: typeof data.view) {
	tiles.cacheAsTexture(false)

	for (const node of nodes) {
		switch (view) {
			case 'cid':
				node.tile.tint = node.color
				node.text.text = node.color.toString(16)
				break
			case 'height':
				node.tile.tint = `hsl(0 0% ${node.height * 100}%)`
				node.text.text = node.height.toFixed(3)
				break
			case 'terrain':
				node.tile.tint = terrain(node.height, node.temperature)
				node.text.text = node.height.toFixed(3)
				break
			case 'temperature':
				node.tile.tint = temperature((node.temperature - tempMin) / (tempMax - tempMin))
				node.text.text = node.temperature.toFixed(2)
				break
			case 'inland':
				node.tile.tint = inland(node.inland, maxInland)
				node.text.text = node.inland === Infinity ? '∞' : node.inland.toString()
				break
			default:
				console.log('视图类型不正确', view)
				node.text.text = 'X'
		}
	}

	tiles.cacheAsTexture({
		antialias: false,
		scaleMode: 'nearest',
	})
}
