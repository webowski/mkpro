import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import pc from 'picocolors'

export function getConfigPath() {
	return path.join(os.homedir(), '.config', 'mkpro', 'config.json')
}

export async function createConfig() {
	const configPath = getConfigPath()

}
