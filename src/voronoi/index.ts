import { Delaunay, randomLcg, type Voronoi } from 'd3'
// @ts-expect-error qaq
import FastNoiseLite from 'fastnoise-lite'
import { type Application, Container, Graphics, Text } from 'pixi.js'
import PoissonDiskSampling from 'poisson-disk-sampling'
import { proxy } from 'valtio/vanilla'
import { watch } from 'valtio/vanilla/utils'
import { temperature, terrain } from '@/base/draw'
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

// 图层
let shapes: Container
let lines: Container
let texts: Container

// 变量
let world: Container
let input: ReturnType<typeof useInput>

let nodes: Node[] = []
let delaunay: Delaunay<Node>
let voronoi: Voronoi<Node>

export const data = proxy<{
	mode: 'line' | 'area'
	view: 'cid' | 'height' | 'terrain' | 'temperature' | 'wind'
}>({
	mode: 'area',
	view: 'temperature',
})

function start() {
	world = new Container({
		parent: app.stage,
		x: app.screen.width / 2,
		y: app.screen.height / 2,
		scale: 0.35,
		eventMode: 'none',
	})

	input = useInput(app, world, {
		zoom: {
			speed: 0.1,
			max: 5,
			min: 0.35,
			default: 0.35,
		},
	})

	// init nodes
	nodes = new PoissonDiskSampling(
		{
			shape: [width, height],
			minDistance: 10,
		},
		random,
	)
		.fill()
		.map<Node>(
			p =>
				({
					x: p[0] - width / 2,
					y: p[1] - height / 2,
				}) as Node,
		)

	// init edges
	delaunay = Delaunay.from(
		nodes,
		d => d.x,
		d => d.y,
	)

	const hw = width / 2
	const hh = height / 2
	voronoi = delaunay.voronoi([-hw, -hh, hw, hh])

	// todo

	// init tiles
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

		// polar
		// node.polar = Math.max(0, Math.min(1, Math.abs(node.y / height) * 0.5))
	})

	// draw
	drawTile(data.view)
	drawText(data.view)
	watch(get => {
		const view = get(data).view
		drawTile(view)
		drawText(view)
	})
}

const debug = document.getElementById('debug') as HTMLSpanElement

function update() {
	debug.innerText = `${app.ticker.deltaMS.toFixed(2)} zoom: ${input.zoom.toFixed(2)}`
	for (const node of nodes) {
		node.text.scale = 1 / input.zoom
		node.text.renderable = input.zoom >= 2 && input.viewport.containsPoint(node.x, node.y)
	}
}

function drawTile(view: typeof data.view) {
	if (!shapes) {
		shapes = new Container({ parent: world })
		Array.from(voronoi.cellPolygons()).forEach(polygon => {
			const node = nodes[polygon.index]
			node.tile = new Graphics().poly(polygon.flat(), true).fill(0xffffff)
			shapes.addChild(node.tile)
		})
	}

	shapes.cacheAsTexture(false)
	for (const node of nodes) {
		switch (view) {
			case 'cid':
				node.tile.tint = node.color
				break
			case 'height':
				node.tile.tint = `hsl(0 0% ${node.height * 100}%)`
				break
			case 'terrain':
				node.tile.tint = terrain(node.height)
				break
			case 'temperature':
				node.tile.tint = temperature((node.temperature - tempMin) / (tempMax - tempMin))
				break
			default:
				console.log('视图类型不正确', view)
		}
	}
	shapes.cacheAsTexture({
		antialias: false,
		scaleMode: 'nearest',
	})
}

function drawLine(mode: typeof data.mode) {
	if (!lines) {
		lines = new Container({ parent: world })
	}
	for (const node of nodes) {
		if (mode === 'line') {
		}
	}
}

function drawText(view: typeof data.view) {
	if (!texts) {
		texts = new Container({ parent: world })
		for (const node of nodes) {
			node.text = new Text({
				parent: texts,
				position: { x: node.x, y: node.y },
				style: { fontSize: 12 },
				anchor: 0.5,
			})
		}
	}

	// shapes.cacheAsTexture(false)
	for (const node of nodes) {
		node.text.scale = 1 / input.zoom
		node.text.renderable = input.zoom >= 2 && input.viewport.containsPoint(node.x, node.y)

		switch (view) {
			case 'cid':
				node.text.text = node.color.toString(16)
				break

			case 'height':
			case 'terrain':
				node.text.text = node.height.toFixed(3)
				break
			case 'temperature':
				node.text.text = node.temperature.toFixed(2)
				break
			default:
				node.text.text = 'X'
				console.log('视图类型不正确', view)
		}
	}
	// shapes.cacheAsTexture({
	// 	antialias: false,
	// 	scaleMode: 'nearest',
	// })
}
