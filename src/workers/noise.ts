import { expose } from 'comlink'
import FastNoiseLite from 'fastnoise-lite-typed'

let batchBuffer: SharedArrayBuffer
let batchArr: Int16Array

const noise = new FastNoiseLite()
noise.SetNoiseType(FastNoiseLite.NoiseType.Perlin)
noise.SetFrequency(0.004)
noise.SetFractalType(FastNoiseLite.FractalType.FBm)
noise.SetFractalLacunarity(2.0)
noise.SetFractalGain(0.5)
noise.SetFractalOctaves(8)

function buf(buffer: SharedArrayBuffer) {
  batchBuffer = buffer
  batchArr = new Int16Array(buffer)
}

function set(props?: {
  seed?: number
  type?: FastNoiseLite.NoiseType
  frequency?: number
  fractalType?: FastNoiseLite.FractalType
  lacunarity?: number
  gain?: number
  octaves?: number
}) {
  if (props?.seed) noise.SetSeed(props.seed)
  if (props?.type) noise.SetNoiseType(props.type)
  if (props?.frequency) noise.SetFrequency(props.frequency)
  if (props?.fractalType) noise.SetFractalType(props.fractalType)
  if (props?.lacunarity) noise.SetFractalLacunarity(props.lacunarity)
  if (props?.gain) noise.SetFractalGain(props.gain)
  if (props?.octaves) noise.SetFractalOctaves(props.octaves)
}

async function gen(chunk: { x: number, y: number, size: number, sample: number }, batch: number) {
  console.log(chunk.x, chunk.y)
  const now = Date.now()

  const buffer = new SharedArrayBuffer(chunk.sample * chunk.sample * Int32Array.BYTES_PER_ELEMENT)
  const array = new Uint32Array(buffer)

  const samples = chunk.sample * chunk.sample
  for (let i = 0; i < samples; i++) {
    if (batch != batchArr[0]) return null
    const x = (i % chunk.sample) / chunk.sample * chunk.size - chunk.size / 2 + 0.5 + chunk.x
    const y = Math.floor(i / chunk.sample) / chunk.sample * chunk.size - chunk.size / 2 + 0.5 + chunk.y
    const v = noise.GetNoise(x, y) / 2 + 0.5
    array[i] = terrain(v)
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

const api = { buf, set, gen }
expose(api)
export type NoiseWorker = typeof api
