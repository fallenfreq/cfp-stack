import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

export default function touchFileAfterBuild(targetFile: string): Plugin {
	return {
		name: 'touch-file-after-build',

		writeBundle() {
			const fullPath = path.resolve(targetFile)

			try {
				fs.utimesSync(fullPath, new Date(), new Date())
				console.log(`Touched file: ${fullPath}`)
			} catch (err) {
				console.error(`Failed to touch file: ${fullPath}`, err)
			}
		},
	}
}
