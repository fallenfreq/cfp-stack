import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

interface FileOptions {
	file: string
	onChange?: () => void
	noChange?: () => void
}

export default function createTrackChangesPlugin(options: FileOptions[]): Plugin {
	const fileTimestamps: Record<string, number> = {}

	return {
		name: 'track-changes-plugin',

		buildStart() {
			const changedFiles: string[] = []

			options.forEach(({ file, onChange, noChange }) => {
				const fullPath = path.resolve(file)

				if (fs.existsSync(fullPath)) {
					const stats = fs.statSync(fullPath)
					const lastModifiedTime = fileTimestamps[fullPath] || 0

					if (stats.mtimeMs > lastModifiedTime) {
						changedFiles.push(fullPath)
						fileTimestamps[fullPath] = stats.mtimeMs
						if (onChange) onChange()
					} else {
						if (noChange) noChange()
					}
				} else {
					console.warn(`File ${fullPath} does not exist.`)
				}
			})

			if (changedFiles.length > 0) {
				console.log('Files changed:', changedFiles)
			}
		},
	}
}
