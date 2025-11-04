import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import pc from 'picocolors'
import { search } from '@inquirer/prompts'
import { fileSelector } from 'inquirer-file-selector'
import { spacing } from './Helpers.js'

export function getConfigPath() {
	return path.join(os.homedir(), '.config', 'mkpro', 'config.json')
}

export async function createConfig() {
	const configPath = getConfigPath()

	spacing()
	console.log(pc.bgBlue('    mkpro configuration    '))
	spacing()

	// Ensure config directory exists
	await fs.ensureDir(path.dirname(configPath))

	// Initialize config object
	const config = {
		paths: {}
	}

	// Define the three types of directories to create
	const dirTypes = [
		{ key: 'repos', name: 'repos', defaultName: 'repos' },
		{ key: 'projects', name: 'projects', defaultName: 'projects' },
		{ key: 'vhosts', name: 'vhosts', defaultName: 'vhosts' }
	]

	// Process each directory type
	for (const dirType of dirTypes) {
		spacing()
		// Use fileSelector to choose target directory
		const targetDir = await fileSelector({
			message: `Select target directory for ${dirType.name}:`,
			validate: (path) => fs.statSync(path).isDirectory(),
			default: os.homedir(),
			filter: item => item.isDirectory,
			onlyShowDir: true
		})

		spacing()
		// Get name for the new directory
		const dirName = await search({
			message: `Enter name for the ${dirType.name} directory (default: ${dirType.defaultName}):`,
			source: async (input, { signal }) => {
				if (!input) {
					return [{
						name: dirType.defaultName,
						value: dirType.defaultName
					}]
				}
				return [{
					name: input,
					value: input
				}]
			}
		})

		spacing()
		// Create the directory
		const selectedPath = typeof targetDir === 'object' && targetDir.path ? targetDir.path : targetDir
	const newDirPath = path.join(selectedPath, dirName)
		await fs.ensureDir(newDirPath)

		// Add path to config
	config.paths[dirType.key] = newDirPath

		console.log(`✅ Created ${dirType.name} directory: ${pc.green(newDirPath)}`)
	}

	// Write config to file
	await fs.writeJson(configPath, config, { spaces: 2 })

	console.log(pc.green(`\nConfiguration saved to ${configPath}`))
	spacing()
	console.log(`Repos path: ${pc.blue(config.paths.repos)}`)
	console.log(`Projects path: ${pc.blue(config.paths.projects)}`)
	console.log(`Vhosts path: ${pc.blue(config.paths.vhosts)}`)
	spacing()
	console.log(pc.bgCyan('    Done    '))
	spacing()
}
