import { setView, view, watchView } from '../voronoi/view'

export default function drawView() {
	const el = document.getElementById('view')
	el?.appendChild(selectView())
}

function selectView() {
	const viewSelect = document.createElement('select')
	viewSelect.name = 'view'
	viewSelect.addEventListener('change', (event) => {
		setView((event.target as HTMLSelectElement).value)
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

	// terrain
	const terrain = document.createElement('option')
	terrain.value = 'terrain'
	terrain.textContent = 'Terrain'
	viewSelect.appendChild(terrain)

	viewSelect.value = view
	watchView((view) => {
		viewSelect.value = view
	})
	return viewSelect
}
