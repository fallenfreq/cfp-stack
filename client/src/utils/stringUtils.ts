function splitFirst(str: string, sep: string | RegExp): string {
	const first = str.split(sep)[0]
	if (first === undefined) return ''
	return first
}

export { splitFirst }
