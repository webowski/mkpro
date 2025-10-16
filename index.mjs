#!/usr/bin/env node
import fs from "fs-extra"
import path from "path"
import os from "os"
import { exec } from "child_process"

class MkPro {
	constructor(args) {
		this.args = args
		this.flags = this.parseFlags(args)
		this.name = this.extractName(args)
		this.home = os.homedir()

		this.paths = {
			projects: path.join(this.home, "projects"),
			vhosts: path.join(this.home, "vhosts"),
			repos: path.join(this.home, "repos"),
		}
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

		// Комбинированные короткие ключи (-ph, -pr и т.д.)
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
		// Имя проекта / хоста / репо — первый аргумент без флагов
		return args.find((a) => !a.startsWith("-"))
	}

	async createProject() {
		if (!this.name) {
			console.error("❌ Укажите название проекта: mkpro -p <name>")
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
			await fs.writeFile(readmePath, `# ${this.name}\n\nОписание проекта.\n`)
		}

		// --- Создаём дополнительные папки ---
		let workspaceFolders = [{ path: "." }]
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

		console.log(`✅ Проект создан: ${projectDir}`)
		console.log(`📂 Подпапки: ${subdirs.join(", ")}`)
		if (this.flags.repo) console.log(`📦 Репозиторий: ${repoDir}`)
		if (this.flags.host) console.log(`🌐 Хост: ${hostDir}`)
		console.log(`🗂  Workspace: ${workspaceFile}`)

		if (this.flags.repo) {
			console.log(`\n Чтобы перейти в папку репозитория:`)
			console.log(`cd ~/repos/${this.name}\n`)
		}
		if (this.flags.host) {
			console.log(`\n Чтобы перейти в папку хоста:`)
			console.log(`cd ~/vhosts/${this.name}.local\n`)
		}

		this.openVSCode(workspaceFile)
	}

	async createHost() {
		if (!this.name) {
			console.error("❌ Укажите имя хоста: mkpro -h <hostname>")
			process.exit(1)
		}

		const hostDir = path.join(this.paths.vhosts, `${this.name}.local`)
		await fs.ensureDir(hostDir)
		console.log(`🌐 Хост создан: ${hostDir}`)
	}

	async createRepo() {
		if (!this.name) {
			console.error("❌ Укажите имя репозитория: mkpro -r <reponame>")
			process.exit(1)
		}

		const repoDir = path.join(this.paths.repos, this.name)
		await fs.ensureDir(repoDir)
		console.log(`📦 Репозиторий создан: ${repoDir}`)
	}

	openVSCode(workspaceFile) {
		exec(`code "${workspaceFile}"`, (err) => {
			if (err) {
				console.warn("⚠️  Не удалось открыть VS Code. Проверь наличие команды 'code' в PATH.")
			}
		})
	}

	async run() {
		const { project, host, repo } = this.flags

		if (!project && !host && !repo) {
			// По умолчанию mkpro <name> = mkpro -p <name>
			this.flags.project = true
			await this.createProject()
			return
		}

		if (project) await this.createProject()
		else if (host) await this.createHost()
		else if (repo) await this.createRepo()
	}
}

// --- Запуск ---
const mkpro = new MkPro(process.argv.slice(2))
mkpro.run()
