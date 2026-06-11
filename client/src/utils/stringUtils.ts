function splitFirst(str: string, sep: string | RegExp): string {
	const first = str.split(sep)[0]
	if (first === undefined) return ''
	return first
}

// Utility functions to escape and unescape HTML content
const escapeHTML = (html: string) => {
	return html
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

export { escapeHTML, splitFirst }
