import { expose } from 'comlink'
import FastNoiseLite from 'fastnoise-lite-typed'

let batchArr: Int16Array
let countArr: Int32Array

const noise = new FastNoiseLite()
noise.SetSeed(Date.now())
noise.SetNoiseType(FastNoiseLite.NoiseType.Perlin)
noise.SetFrequency(0.015)
noise.SetFractalType(FastNoiseLite.FractalType.FBm)
noise.SetFractalLacunarity(2.0)
noise.SetFractalGain(0.5)
noise.SetFractalOctaves(8)

function buf(batch: SharedArrayBuffer, count: SharedArrayBuffer) {
  batchArr = new Int16Array(batch)
  countArr = new Int32Array(count)
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

async function gen(batch: number, chunk: { x: number, y: number }, size: number, sample: number) {
  countArr[0]++
  const now = Date.now()

  const buffer = new SharedArrayBuffer(sample * sample * Int32Array.BYTES_PER_ELEMENT)
  const array = new Uint32Array(buffer)

  const samples = sample * sample
  for (let i = 0; i < samples; i++) {
    if (batch != batchArr[0]) {
      countArr[0]--
      return null
    }
    const x = (i % sample) / sample * size - size / 2 + 0.5 + chunk.x
    const y = Math.floor(i / sample) / sample * size - size / 2 + 0.5 + chunk.y
    const v = noise.GetNoise(x, y) / 2 + 0.5
    array[i] = terrain(v)
  }

  console.log('gen time', Date.now() - now + 'ms')
  countArr[0]--
  return buffer
}

// function heightmap(v: number) {
//   v = Math.floor(v * 255)
//   return 255 << 24 | v << 16 | v << 8 | v
// }

const step = 0.01
function terrain(v: number) {
  const steppedValue = Math.floor(v / step) * step
  const colorSteps: [number, number, number][] = [
    [0.5, 0xffb85d38, 0xfffb9a70],
    [0.8, 0xff237810, 0xff90d9fd],
    [1.0, 0xffeeeeee, 0xffffffff],
  ]

  // 找到台阶值所在的区间
  for (let i = 0; i < colorSteps.length; i++) {
    const [threshold2, color1, color2] = colorSteps[i]
    const threshold1 = i === 0 ? 0 : colorSteps[i - 1][0]

    if (steppedValue >= threshold1 && steppedValue < threshold2) {
      const t = (steppedValue - threshold1) / (threshold2 - threshold1)

      const a1 = (color1 >> 24) & 0xff
      const r1 = (color1 >> 16) & 0xff
      const g1 = (color1 >> 8) & 0xff
      const b1 = color1 & 0xff

      const a2 = (color2 >> 24) & 0xff
      const r2 = (color2 >> 16) & 0xff
      const g2 = (color2 >> 8) & 0xff
      const b2 = color2 & 0xff

      const a = Math.round(a1 + (a2 - a1) * t)
      const r = Math.round(r1 + (r2 - r1) * t)
      const g = Math.round(g1 + (g2 - g1) * t)
      const b = Math.round(b1 + (b2 - b1) * t)

      return (a << 24) | (r << 16) | (g << 8) | b
    }
  }

  return colorSteps[colorSteps.length - 1][1]
}

const api = { buf, set, gen }
expose(api)
export type NoiseWorker = typeof api
