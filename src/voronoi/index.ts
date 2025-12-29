import { Delaunay, randomLcg, type Voronoi } from 'd3'
import { type Application, Container, Graphics, RenderTexture, Sprite, Texture, TextureSource } from 'pixi.js'
import PoissonDiskSampling from 'poisson-disk-sampling'
import useDrag from '@/base/drag'
import usePointer from '@/base/pointer'
import useZoom from '@/base/zoom'

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
	point?: Graphics
	shape?: Graphics
}

const width = 4000
const height = 2000
const seed = 9856
const random = randomLcg(seed)
const nodes: Point[] = []

let world: Container
let delaunay: Delaunay<Point>
let voronoi: Voronoi<Point>

let pointer: ReturnType<typeof usePointer>
let zoom: ReturnType<typeof useZoom>
let drag: ReturnType<typeof useDrag>

function start() {
	// 根元素
	world = new Container()
	world.x = app.screen.width / 2
	world.y = app.screen.height / 2
	app.stage.addChild(world)

	// 通用操作
	pointer = usePointer(app)
	drag = useDrag(app, world)
	zoom = useZoom(app, world, {
		speed: 0.1,
		max: 5,
		min: 0.5,
		default: 1,
	})
	zoom.apply(drag, pointer)

	// 初始化节点
	const pds = new PoissonDiskSampling(
		{
			shape: [width, height],
			minDistance: 10,
		},
		random,
	)

	const colors = new Set<number>()
	pds.fill().forEach((p, i) => {
		const color = (i * 7821629) % 2 ** 24
		colors.add(color)
		nodes.push({ x: p[0] - width / 2, y: p[1] - height / 2, color })
	})
	console.log('points', pds.getAllPoints().length, 'colors', colors.size)

	// 初始化网格
	delaunay = Delaunay.from(
		nodes,
		(d) => d.x,
		(d) => d.y,
	)

	const hw = width / 2
	const hh = height / 2
	voronoi = delaunay.voronoi([-hw, -hh, hw, hh])

	// cid
	const map = new Container({ parent: world })
	map.cacheAsTexture({
		antialias: false,
		scaleMode: 'nearest',
	})

	Array.from(voronoi.cellPolygons()).forEach((polygon) => {
		const node = nodes[polygon.index]
		node.shape = new Graphics().poly(polygon.flat(), true).fill(node.color)
		map.addChild(node.shape)
	})

	// const texture = RenderTexture.create({
	// 	width,
	// 	height,
	// 	antialias: false,
	// 	scaleMode: 'nearest',
	// })
	// app.renderer.render({
	// 	container: map,
	// 	target: texture,
	// 	x: -hw,
	// 	y: -hh,
	// })
	// const sprite = new Sprite({
	// 	parent: world,
	// 	texture,
	// })
	// console.log('sprite', sprite.width, sprite.height)
	// map.destroy()

	// height

	//

	//

	//

	// river

	app.stage.addChild(ptr)
}

const ptr = new Graphics().circle(0, 0, 5).fill(0x000000)

const debug = document.getElementById('debug') as HTMLSpanElement

function update() {
	// ptr.position.set(pointer.x, pointer.y)
	debug.innerText = `${app.ticker.deltaMS}`
	// debug.innerText = `zoom(${zoom.value}) pointer(x: ${pointer.x.toFixed(2)}, y: ${pointer.y.toFixed(2)}) world(x: ${world.x.toFixed(2)}, y: ${world.y.toFixed(2)})`
}
