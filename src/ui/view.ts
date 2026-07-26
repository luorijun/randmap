import { watch } from 'valtio/vanilla/utils'
import { data } from '@/voronoi'

export default function drawView() {
	const el = document.getElementById('view')
	el?.setAttribute('style', 'display: flex; align-items: center; gap: 8px;')
	el?.appendChild(modeSelect())
	el?.appendChild(viewSelect())
}

function modeSelect() {
	const modeSelect = document.createElement('select')
	modeSelect.name = 'mode'
	modeSelect.addEventListener('change', event => {
		data.mode = (event.target as HTMLSelectElement).value as typeof data.mode
	})

	// area
	const area = document.createElement('option')
	area.value = 'area'
	area.textContent = 'Area'
	modeSelect.appendChild(area)

	// line
	const line = document.createElement('option')
	line.value = 'line'
	line.textContent = 'Line'
	modeSelect.appendChild(line)

	modeSelect.value = data.mode
	watch(get => {
		modeSelect.value = get(data).mode
	})
	return modeSelect
}

function viewSelect() {
	const viewSelect = document.createElement('select')
	viewSelect.name = 'view'
	viewSelect.addEventListener('change', event => {
		data.view = (event.target as HTMLSelectElement).value as typeof data.view
	})

	// cid
	const cid = document.createElement('option')
	cid.value = 'cid'
	cid.textContent = 'CID'
	viewSelect.appendChild(cid)

	// height
	const height = document.createElement('option')
	height.value = 'height'
	height.textContent = 'Heightmap'
	viewSelect.appendChild(height)

	// biome
	const biome = document.createElement('option')
	biome.value = 'biome'
	biome.textContent = 'Biome'
	viewSelect.appendChild(biome)

	// temperature
	const temperature = document.createElement('option')
	temperature.value = 'temperature'
	temperature.textContent = 'Temperature'
	viewSelect.appendChild(temperature)

	// polar
	const inland = document.createElement('option')
	inland.value = 'inland'
	inland.textContent = 'Inland'
	viewSelect.appendChild(inland)

	const humidity = document.createElement('option')
	humidity.value = 'humidity'
	humidity.textContent = 'Humidity'
	viewSelect.appendChild(humidity)

	viewSelect.value = data.view
	watch(get => {
		viewSelect.value = get(data).view
	})
	return viewSelect
}
