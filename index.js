#!/usr/bin/env node
import MkPro from './MkPro.js'
import { createConfig } from './ConfigManager.js'

const mkpro = new MkPro(process.argv.slice(2))

mkpro.run()
