import FastNoiseLite from 'fastnoise-lite-typed'
import { expose } from 'comlink'

const noise: FastNoiseLite = new FastNoiseLite()
noise.SetNoiseType(FastNoiseLite.NoiseType.Perlin)
noise.SetFrequency(0.02)
noise.SetFractalType(FastNoiseLite.FractalType.FBm)
noise.SetFractalOctaves(4)

let width: number
let height: number
let buffer: SharedArrayBuffer
let array: Uint32Array

async function set(params: { width: number, height: number }) {
  width = params.width
  height = params.height
  buffer = new SharedArrayBuffer(params.width * params.height * Int32Array.BYTES_PER_ELEMENT)
  array = new Uint32Array(buffer)
}

async function gen(chunk: { x: number, y: number }) {
  if (!width || !height || !buffer || !array) {
    throw new Error('noise 没有初始化配置')
  }

  const now = Date.now()
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let v = noise.GetNoise((chunk.x * width + x), (chunk.y * height + y))
      v = Math.floor((v + 1) * 0.5 * 255)
      array[y * width + x] = (255 << 24) | (v << 16) | (v << 8) | v
    }
  }
  console.log('gen time', Date.now() - now + 'ms')
  return buffer
}

const api = {
  set,
  gen,
}
expose(api)
export type Api = typeof api
