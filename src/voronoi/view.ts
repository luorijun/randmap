export let view = 'terrain'

export function setView(newView: string) {
	view = newView
	dispatchEvent(new CustomEvent('view:change', { detail: view }))
}

export function watchView(callback: (view: string) => void) {
	addEventListener('view:change', (event) => {
		const value = (event as CustomEvent<string>).detail
		callback(value)
	})
}
