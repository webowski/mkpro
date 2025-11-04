import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import pc from 'picocolors'
import { select } from '@inquirer/prompts'
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

	// Default paths
	const defaultReposPath = path.join(os.homedir(), 'repos')
	const defaultProjectsPath = path.join(os.homedir(), 'projects')
	const defaultVhostsPath = path.join(os.homedir(), 'vhosts')

	// Search for existing directories
	const homeDir = os.homedir()
	const homeContents = await fs.readdir(homeDir)
	const possiblePaths = {
		repos: homeContents.filter(item => item.toLowerCase().includes('repos')).map(item => path.join(homeDir, item)),
		projects: homeContents.filter(item => item.toLowerCase().includes('project')).map(item => path.join(homeDir, item)),
		vhosts: homeContents.filter(item => item.toLowerCase().includes('vhost') || item.toLowerCase().includes('host')).map(item => path.join(homeDir, item))
	}

	// Add default paths to options
	possiblePaths.repos.push(defaultReposPath)
	possiblePaths.projects.push(defaultProjectsPath)
	possiblePaths.vhosts.push(defaultVhostsPath)

	// Remove duplicates
	const uniquePaths = {
		repos: [...new Set(possiblePaths.repos)],
		projects: [...new Set(possiblePaths.projects)],
		vhosts: [...new Set(possiblePaths.vhosts)]
	}

	// Add option for creating new directory
	uniquePaths.repos.push('Create new directory')
	uniquePaths.projects.push('Create new directory')
	uniquePaths.vhosts.push('Create new directory')

	// Prompt for each path
	const reposPath = await select({
		message: ' Select repos directory:',
		choices: uniquePaths.repos.map(p => ({ name: p, value: p }))
	})

	spacing()
	const projectsPath = await select({
		message: ' Select projects directory:',
		choices: uniquePaths.projects.map(p => ({ name: p, value: p }))
	})

	spacing()
	const vhostsPath = await select({
		message: ' Select vhosts directory:',
		choices: uniquePaths.vhosts.map(p => ({ name: p, value: p }))
	})

	spacing()
	// Handle creation of new directories if selected
	const finalReposPath = reposPath === 'Create new directory'
		? path.join(homeDir, 'repos')
		: reposPath

	const finalProjectsPath = projectsPath === 'Create new directory'
		? path.join(homeDir, 'projects')
		: projectsPath

	const finalVhostsPath = vhostsPath === 'Create new directory'
		? path.join(homeDir, 'vhosts')
		: vhostsPath

	// Create directories if they don't exist
	await fs.ensureDir(finalReposPath)
	await fs.ensureDir(finalProjectsPath)
	await fs.ensureDir(finalVhostsPath)

	// Create config object
	const config = {
		paths: {
			repos: finalReposPath,
			projects: finalProjectsPath,
			vhosts: finalVhostsPath
		}
	}

	// Write config to file
	await fs.writeJson(configPath, config, { spaces: 2 })

	console.log(pc.green(`Configuration saved to ${configPath}`))
	spacing()
	console.log(`Repos path: ${pc.blue(finalReposPath)}`)
	console.log(`Projects path: ${pc.blue(finalProjectsPath)}`)
	console.log(`Vhosts path: ${pc.blue(finalVhostsPath)}`)
	spacing()
	console.log(pc.bgCyan('    Done    '))
	spacing()
}
