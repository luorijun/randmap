import FastNoiseLite from 'fastnoise-lite-typed'
import { expose } from 'comlink'

const noise: FastNoiseLite = new FastNoiseLite()
// noise.SetSeed(Date.now())
noise.SetNoiseType(FastNoiseLite.NoiseType.Perlin)
noise.SetFrequency(0.004)
noise.SetFractalType(FastNoiseLite.FractalType.FBm)
noise.SetFractalLacunarity(2.0)
noise.SetFractalGain(0.5)
noise.SetFractalOctaves(8)

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
      const v = noise.GetNoise((chunk.x * width + x), (chunk.y * height + y)) / 2 + 0.5
      // array[y * width + x] = (255 << 24) | (v << 16) | (v << 8) | v
      array[y * width + x] = terrain(v)
    }
  }
  console.log('gen time', Date.now() - now + 'ms')
  return buffer
}

function heightmap(v: number) {
  v = Math.floor(v * 255)
  return 255 << 24 | v << 16 | v << 8 | v
}

function terrain(v: number) {
  if (v < 0.5) return 0xffd17d24 // 浅海 (蓝色)
  if (v < 0.6) return 0xff55a63a // 平原 (绿色)
  if (v < 0.7) return 0xff397825 // 森林 (深绿色)
  if (v < 0.8) return 0xff808080 // 丘陵 (灰色)
  if (v < 0.9) return 0xffa9a9a9 // 山脉 (深灰色)
  return 0xffffffff // 雪峰 (白色)
}

const api = {
  set,
  gen,
}

expose(api)
export type NoiseWorker = typeof api
