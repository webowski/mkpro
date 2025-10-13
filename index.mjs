#!/usr/bin/env node
import fs from "fs-extra"
import path from "path"
import os from "os"
import { exec } from "child_process"

class ProjectCreator {
	constructor(projectName) {
		if (!projectName) {
			console.error("❌ Укажите имя проекта: mkpro <projectname>")
			console.log("Пример: mkpro myproject")
			process.exit(1)
		}

		this.projectName = projectName
		this.projectsDir = path.join(os.homedir(), "projects")
		this.projectDir = path.join(this.projectsDir, projectName)
		this.repoDir = path.join(os.homedir(), "repos", projectName)
		this.workspaceFile = path.join(this.projectDir, `${projectName}.code-workspace`)
		this.subdirs = ["materials", "docs"]
	}

	async createStructure() {
		// Создаём корневую папку проекта и подпапки
		await fs.ensureDir(this.projectDir)
		for (const dir of this.subdirs) {
			await fs.ensureDir(path.join(this.projectDir, dir))
		}

		// Создаём README.md
		const readmePath = path.join(this.projectDir, "README.md")
		if (!(await fs.pathExists(readmePath))) {
			await fs.writeFile(readmePath, `# ${this.projectName}\n\nОписание проекта.\n`)
		}

		// Создаём папку репозитория
		await fs.ensureDir(this.repoDir)
	}

	async createWorkspace() {
		const workspaceData = {
			folders: [
				{ name: "repo", path: this.repoDir },
				{ path: "." }
			],
			settings: {}
		}

		await fs.writeJson(this.workspaceFile, workspaceData, { spaces: "\t" })
	}

	openInVSCode() {
		exec(`code "${this.workspaceFile}"`, (err) => {
			if (err) {
				console.warn("⚠️  Не удалось открыть VS Code. Убедись, что команда 'code' доступна в PATH.")
			}
		})
	}

	async run() {
		try {
			await this.createStructure()
			await this.createWorkspace()

			console.log(`✅ Проект создан: ${this.projectDir}`)
			console.log(`📂 Подпапки: ${this.subdirs.join(", ")}`)
			console.log(`🗂  Workspace файл: ${this.workspaceFile}`)

			this.openInVSCode()
		} catch (err) {
			console.error("Ошибка:", err.message)
			process.exit(1)
		}
	}
}

// --- Запуск ---
const projectName = process.argv[2]
const creator = new ProjectCreator(projectName)
creator.run()
