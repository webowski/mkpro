import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import pc from 'picocolors'
import { exec } from 'child_process'
import { getConfigPath } from './ConfigManager.js'
import { spacing } from './Helpers.js'

export default class MkPro {
	constructor(args) {
		this.args = args
		this.flags = this.parseFlags(args)
		this.name = this.extractName(args)
		this.home = os.homedir()

		// Load paths from config, fallback to default paths if config doesn't exist
		this.paths = this.loadPathsFromConfig()
	}

	loadPathsFromConfig() {
		const configPath = getConfigPath()
		try {
			const config = fs.readJsonSync(configPath)
			if (!config.paths) {
				console.error("Config file is missing 'paths' property")
				process.exit(1)
			}
			return config.paths
		} catch (error) {
			console.error("Config file does not exist or is invalid. Run 'mkpro --config' to create a configuration.")
			process.exit(1)
		}
	}

	async run() {
		const { project, host, repo } = this.flags

		spacing()
		console.log(pc.bgBlue('    mkpro    '))
		spacing()

		if (!project && !host && !repo) {
			// By default mkpro <name> = mkpro -p <name>
			this.flags.project = true
			await this.createProject()
			return
		}

		if (project) await this.createProject()
		else if (host) await this.createHost()
		else if (repo) await this.createRepo()
	}

	parseFlags(args) {
		const flags = {
			project: false,
			host: false,
			repo: false,
		}

		if (args.includes("-p")) flags.project = true
		if (args.includes("-h")) flags.host = true
		if (args.includes("-r")) flags.repo = true

		// Combined short flags (-ph, -pr etc.)
		for (const arg of args) {
			if (arg.startsWith("-")) {
				if (arg.includes("p")) flags.project = true
				if (arg.includes("h")) flags.host = true
				if (arg.includes("r")) flags.repo = true
			}
		}

		return flags
	}

	extractName(args) {
		// Project / host / repo name - first argument without flags
		return args.find((a) => !a.startsWith("-"))
	}

	async createProject() {
		if (!this.name) {
			console.error("❌ Specify project name: mkpro -p <name>")
			process.exit(1)
		}

		const projectDir = path.join(this.paths.projects, this.name)
		const workspaceFile = path.join(projectDir, `${this.name}.code-workspace`)
		const repoDir = path.join(this.paths.repos, this.name)
		const hostDir = path.join(this.paths.vhosts, `${this.name}.local`)
		const subdirs = ["materials", "docs"]

		// --- Создаём структуру проекта ---
		await fs.ensureDir(projectDir)
		for (const dir of subdirs) {
			await fs.ensureDir(path.join(projectDir, dir))
		}

		const readmePath = path.join(projectDir, "README.md")
		if (!(await fs.pathExists(readmePath))) {
			await fs.writeFile(readmePath, `# ${this.name}\n\nProject description.\n`)
		}

		// --- Создаём дополнительные папки ---
		let workspaceFolders = [{ name: "project", path: "." }]
		if (this.flags.repo) {
			await fs.ensureDir(repoDir)
			workspaceFolders.unshift({ name: "repo", path: repoDir })
		}
		if (this.flags.host) {
			await fs.ensureDir(hostDir)
			workspaceFolders.unshift({ name: "host", path: hostDir })
		}

		// --- Workspace ---
		const workspaceData = { folders: workspaceFolders, settings: {} }
		await fs.writeJson(workspaceFile, workspaceData, { spaces: "\t" })

		console.log(`✅ Project created: ${projectDir}`)
		console.log(`📂 Subfolders: ${subdirs.join(", ")}`)
		if (this.flags.repo) console.log(`Repository: ${repoDir}`)
		if (this.flags.host) console.log(`Host: ${hostDir}`)
		console.log(`Workspace: ${workspaceFile}`)

		// if (this.flags.repo) {
		// 	console.log(`\n To go to the repository folder:`)
		// 	console.log(`cd ~/repos/${this.name}\n`)
		// }

		// if (this.flags.host) {
		// 	console.log(`\n To go to the host folder:`)
		// 	console.log(`cd ~/vhosts/${this.name}.local\n`)
		// }

		spacing()
		console.log(pc.bgCyan('    Done    '))
		spacing()

		this.openVSCode(workspaceFile)
	}

	async createHost() {
		if (!this.name) {
			console.error("Specify host name: mkpro -h <hostname>")
			process.exit(1)
		}

		const hostDir = path.join(this.paths.vhosts, `${this.name}.local`)
		await fs.ensureDir(hostDir)
		console.log(`🌐 Host created: ${hostDir}`)
	}

	async createRepo() {
		if (!this.name) {
			console.error("Specify repository name: mkpro -r <reponame>")
			process.exit(1)
		}

		const repoDir = path.join(this.paths.repos, this.name)
		await fs.ensureDir(repoDir)
		console.log(`Repository created: ${repoDir}`)
	}

	openVSCode(workspaceFile) {
		exec(`code "${workspaceFile}"`, (err) => {
			if (err) {
				console.warn("Failed to open VS Code. Check if 'code' command is in PATH.")
			}
		})
	}
}
