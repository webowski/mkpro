#!/usr/bin/env node
import MkPro from './MkPro.js'

const mkpro = new MkPro(process.argv.slice(2))
mkpro.run()
