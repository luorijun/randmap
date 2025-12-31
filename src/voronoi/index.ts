import { Delaunay, randomLcg, type Voronoi } from 'd3'
import FastNoiseLite from 'fastnoise-lite-typed'
import { type Application, Container, Graphics, Text } from 'pixi.js'
import PoissonDiskSampling from 'poisson-disk-sampling'
import { terrain } from '@/base/draw'
import { useInput } from '@/base/input'
import { view, watchView } from '@/voronoi/view'

let app: Application
export async function init(pixiApp: Application) {
	app = pixiApp
	start()
	app.ticker.add(update)
}

type Point = {
	x: number
	y: number
	color: number
	height: number
	tile: Graphics
	text: Text
}

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

const nodes: Point[] = []

let world: Container
let delaunay: Delaunay<Point>
let voronoi: Voronoi<Point>
let shapes: Container
let texts: Container

let input: ReturnType<typeof useInput>

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

	// init tiles
	const pds = new PoissonDiskSampling(
		{
			shape: [width, height],
			minDistance: 10,
		},
		random,
	)

	pds.fill().forEach((p, i) => {
		const node = {
			x: p[0] - width / 2,
			y: p[1] - height / 2,
		} as Point
		nodes.push(node)

		// cid
		node.color = (i * 7821629) % 2 ** 24

		// height
		const max = Math.max(width, height)
		node.height = (noise.GetNoise(node.x / max, node.y / max) + 1) * 0.5
	})

	// init mesh
	delaunay = Delaunay.from(
		nodes,
		(d) => d.x,
		(d) => d.y,
	)

	const hw = width / 2
	const hh = height / 2
	voronoi = delaunay.voronoi([-hw, -hh, hw, hh])

	// draw
	drawTile(view)
	drawText(view)
	watchView((view) => {
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

function drawTile(view: string) {
	if (!shapes) {
		shapes = new Container({ parent: world })
		Array.from(voronoi.cellPolygons()).forEach((polygon) => {
			const node = nodes[polygon.index]
			node.tile = new Graphics().poly(polygon.flat(), true).fill(0xffffff)
			shapes.addChild(node.tile)
		})
	}

	shapes.cacheAsTexture(false)
	switch (view) {
		case 'cid': {
			for (const node of nodes) {
				node.tile.tint = node.color
			}
			break
		}
		case 'height': {
			for (const node of nodes) {
				node.tile.tint = `hsl(0 0% ${node.height * 100}%)`
			}
			break
		}
		case 'terrain': {
			let max = -Infinity
			let min = Infinity
			for (const node of nodes) {
				max = Math.max(max, node.height)
				min = Math.min(min, node.height)
				node.tile.tint = terrain(node.height)
			}
			console.log(`min: ${min}, max: ${max}`)
			break
		}
		default:
			console.log('视图类型不正确', view)
	}
	shapes.cacheAsTexture({
		antialias: false,
		scaleMode: 'nearest',
	})
}

function drawText(view: string) {
	if (!texts) {
		texts = new Container({ parent: world, eventMode: 'none' })
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

			default:
				console.log('视图类型不正确', view)
		}
	}
	// shapes.cacheAsTexture({
	// 	antialias: false,
	// 	scaleMode: 'nearest',
	// })
}
