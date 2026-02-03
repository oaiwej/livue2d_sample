import { logger } from '@/logger'

/**
 * Load a file as bytes.
 *
 * @param filePath - The path to the file to be loaded.
 * @returns A promise that resolves to an ArrayBuffer containing the file's bytes.
 */
export async function loadFileAsBytes(filePath: string): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    fetch(filePath).then((response) => {
      if (!response.ok) {
        logger.error(`Failed to load file: ${filePath}`)
        reject(new Error(`Failed to load file: ${filePath}`))
        return
      }

      response.arrayBuffer().then(resolve, reject)
    }, reject)
  })
}
