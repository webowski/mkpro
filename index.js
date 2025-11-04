#!/usr/bin/env node
import MkPro from './MkPro.js'
import { createConfig } from './ConfigManager.js'

const args = process.argv.slice(2)

// Check if --config flag is present
if (args.includes('--config')) {
	createConfig()
} else {
	const mkpro = new MkPro(args)
	mkpro.run()
}
