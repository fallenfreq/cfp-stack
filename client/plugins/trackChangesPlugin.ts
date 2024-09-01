import fs from 'fs'
import path from 'path'
import { Plugin } from 'vite'

// Define the type for file options
interface FileOptions {
  file: string
  onChange?: () => void
  noChange?: () => void
}

// Create the plugin with the specified options
export default function createTrackChangesPlugin(options: FileOptions[]): Plugin {
  // Initialize file timestamps map
  let fileTimestamps: { [key: string]: number } = {}

  return {
    name: 'track-changes-plugin',

    buildStart() {
      const changedFiles: string[] = []

      options.forEach(({ file, onChange, noChange }) => {
        const fullPath = path.resolve(file)

        // Check if the file exists before accessing its stats
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath)

          // Get the last modified time of the file
          const lastModifiedTime = fileTimestamps[fullPath] || 0

          if (stats.mtimeMs > lastModifiedTime) {
            // File has changed
            changedFiles.push(fullPath)
            fileTimestamps[fullPath] = stats.mtimeMs
            onChange && onChange() // Call the onChange function
          } else {
            // File has not changed
            noChange && noChange() // Call the noChange function
          }
        } else {
          // Handle case where file does not exist
          console.warn(`File ${fullPath} does not exist.`)
        }
      })

      if (changedFiles.length > 0) {
        console.log('Files changed:', changedFiles)
      }
    }
  }
}
