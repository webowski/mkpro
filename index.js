// Tools
// -----------------------------------

const fs           = require('fs-extra')
const clc          = require('cli-color')
const os           = require('os')
const path         = require('path')
const AdmZip       = require('adm-zip')
const fetch        = require('node-fetch')
const readdirp     = require('readdirp')
const async        = require('async')

let config         = require('./config.json')

const tools = {
	fs:            fs,
	clc:           clc,
	os:            os,
	path:          path,
	config:        config,
	AdmZip:        AdmZip,
	fetch:         fetch,
}

// Config special
let configSpecial = JSON.parse(`{
	"trello": {
		"key": "",
		"token": "",
		"sourceBoard": ""
	}
}`)

try {
	configSpecial = require('./config-special.json')
} catch (error){
	console.error( error )
}

tools.config = { ...configSpecial, ...tools.config }
config = tools.config


const color = {
	file: tools.clc.xterm(69),
	success: tools.clc.xterm(47),
	exclaim: tools.clc.xterm(226),
	warning: tools.clc.xterm(1),
	error: tools.clc.xterm(9),
	muted: tools.clc.xterm(242)
}

const bold = tools.clc.bold
tools.color = color


// tools.createBoard = require('./trello.js')(tools)


let projectLocation = config.project.location
if (projectLocation[0] === '~') {
	projectLocation = projectLocation.replace('~', tools.os.homedir())
}
let projectName = config.project.name
let projectPath = tools.path.join( projectLocation, projectName )


// Sequence
// -----------------------------------
async.waterfall([
	// Project folder
	function(callback) {

		var isFolderCreated = createFolder(projectPath)

		if ( !isFolderCreated ) {
			// return scriptEnd('fail')
		}
		callback()
	},
	// The project folder blank
	function(callback) {

		let blankArchiveUrl = config.project.blank

		downloadFile( blankArchiveUrl, filepath => {

			unpackArchive(filepath, () => {

				removeFiles([
					'.keep',
					'README.md'
				], () => {
					removeFile( filepath )
					callback()
				})

			})
		})
	},
	// Rename the editor config file
	function(callback) {
		renameConfigFile((newPath) => {
			config.editorConfig = newPath
			callback()
		})
	},
	// Edit the editor config file
	function(callback) {
		editConfigFile(config.editorConfig, callback)
	},
	// Trello board
	function(callback) {
		createBoard( tools.config.project.name, () => {
			callback()
		})
	}
], function(error, result) {
	scriptEnd('success')
})


// Functions
// -----------------------------------

function createFolder(projectPath) {

	// if folder is exists
	if (tools.fs.existsSync( projectPath )) {
		console.error(
			tools.color.error('Error.'),
			'The folder',
			tools.color.file( projectPath ),
			'already exists',
		)
		return false
	}

	// Make project folder
	tools.fs.mkdirsSync( projectPath, err => {
		console.log(
			color.error(err)
		)
	})

	console.log(
		'The folder',
		tools.color.file( projectPath ),
		'is created',
	)

	return true
}

async function downloadFile(sourceUrl, callback) {
	const res = await fetch( sourceUrl )

	await new Promise((resolve, reject) => {

		let filename = getFilenameFromRes(res)
		let filepath = path.join(projectPath, filename)
		let fileStream = fs.createWriteStream( filepath )

		res.body.pipe(fileStream)

		res.body.on('error', (err) => {
			reject(err)
		})

		fileStream.on('finish', () => {
			resolve()

			console.log(
				tools.color.file( filename ),
				'is downloaded',
			)

			if (typeof callback === "function") callback(filepath)
		})
	})
}

function getFilenameFromRes(res) {
	let filename = res.headers.get('content-disposition')
		.split(';')
		.find(n => n.includes('filename='))
		.replace('filename=', '')
		.trim()
	return filename
}

function removeFile(targetPath) {
	fs.removeSync( targetPath )
	let filename = path.basename(targetPath)
	console.log(
		tools.color.file( filename ),
		'is removed',
	)
	return true
}

function unpackArchive(filepath, callback) {

	let zip = new AdmZip(filepath)
	let zipEntries = zip.getEntries()
	let targetDirName = path.basename(filepath, '.zip')

	// Run through the entries array
	zipEntries.forEach(function(zipEntry) {

		if ( ! zipEntry.isDirectory ) {

			let entryName = zipEntry.entryName

			let entryTargetDir =
				path.dirname(
					path.join(
						projectPath,
						zipEntry.entryName.replace(targetDirName + '/', '')
					)
				)

			// Extract entry
			zip.extractEntryTo(
				// entry name
				zipEntry.entryName,
				// target path
				entryTargetDir,
				// maintainEntryPath
				false,
				// overwrite
				true
			)
		}
	})

	console.log(
		tools.color.file( path.basename(filepath) ),
		'is unpacked',
	)

	if (typeof callback === "function") callback()
}

// argument `files` is string or array of strings
function removeFiles(files, callback) {
	readdirp(projectPath , {
		fileFilter: files,
		alwaysStat: true
	})
		.on('data', (entry) => {
			// const {path, stats: {size}} = entry
			// console.log(`${JSON.stringify({path, size})}`)
			// console.log( entry.path )
			fs.removeSync( path.join(projectPath, entry.path) )
		})
		// Optionally call stream.destroy() in `warn()` in order to abort and cause 'close' to be emitted
		.on('warn', error => console.error('non-fatal error', error))
		.on('error', error => console.error('fatal error', error))
		.on('end', () => {
			if (typeof callback === 'function') callback()
		})
}

function scriptEnd(type) {
	type = type || 'fail'

	if (type === 'success') {
		console.log(
			color.success('Success.'),
			'The project',
			color.file(projectName),
			'is created',
		)
		return true
	} else {
		console.log(
			color.error('The end.'),
			color.file('mkpro'),
			'execution is stopped'
		)
		return false
	}
}

// Sublime text project file
// returns new file path
function renameConfigFile(callback) {

	fs.readdir(projectPath, (error, files) => {

		let projectConfigName = files.find( name => {
			return name.match(/.*\.code-workspace/)
		})

		if ( !projectConfigName ) return false

		let newProjectConfigName = projectName + path.extname(projectConfigName)

		let oldPath = path.join(projectPath, projectConfigName)
		let newPath = path.join(projectPath, newProjectConfigName)


		fs.rename(oldPath, newPath, (error) => {
			if (error) throw error

			console.log(
				'File',
				color.file(projectConfigName),
				'is renamed to',
				color.file(newProjectConfigName),
			)

			if (typeof callback === 'function') callback(newPath)
		})
	})

}

function editConfigFile(filePath, callback) {

	fs.readFile( filePath, 'utf8', (error, data) => {
		if (error) throw error

		let vhostPath = path.join( '~/vhosts', projectName + '.loc' )
		let repoPath = path.join( '~/repos', projectName )

		let content = eval('`' + data + '`')

		fs.writeFile( filePath, content, error => {
			if (error) throw error

			callback()
		})
	})
}


// Trello
// -----------------------------------
// https://developer.atlassian.com/cloud/trello/rest/api-group-boards/#api-boards-post

const key = tools.config.trello.key
const token = tools.config.trello.token

const sourceBoardUrlId = tools.config.trello.sourceBoard


function createBoard(boardName, createBoardCb) {

	let newBoardName = boardName || 'Новая доска'

	let createBoardUrl = new URL('https://api.trello.com/1/boards/?')
	createBoardUrl.searchParams.append('key', key)
	createBoardUrl.searchParams.append('token', token)
	createBoardUrl.searchParams.append('name', newBoardName)
	createBoardUrl.searchParams.append('prefs_background', 'grey')
	// createBoardUrl.searchParams.append('prefs_selfJoin', false)
	// createBoardUrl.searchParams.append('idOrganization', '\x00')

	restGetBoardId( sourceBoardUrlId, boardId => {

		createBoardUrl.searchParams.append('idBoardSource', boardId)

		restCreateBoard(createBoardUrl, () => {
			createBoardCb()
		})
	})
}

function restCreateBoard(url, restCreateBoardCb) {
	fetch(url.href, {
			method: 'POST',
		})
		.then(response => {
			// console.log(
			// 	`Response: ${response.status} ${response.statusText}`
			// )
			console.log(
				{ response }
			)
			return response.text()
		})
		.then(text => {
			let json = JSON.parse(text)
			let url = json.url
			console.log(
				'Trello board',
				tools.color.file(url),
				'is created',
			)
			restCreateBoardCb()
		})
		.catch(err => console.error(err))
}

function restGetBoardId(boardUrlId, callback) {

	fetch(`https://api.trello.com/1/boards/${boardUrlId}?key=${key}&token=${token}`, {
			method: 'GET',
			headers: {
				'Accept': 'application/json'
			}
		})
		.then(response => {
			// console.log(
			// 	`Getting the source board ID`
			// )
			// console.log(
			// 	`Response: ${response.status} ${response.statusText}`
			// )
			return response.text();
		})
		.then(text => {
			let responseObj = JSON.parse(text)
			// console.log({ responseObj })
			// console.log(responseObj.name)
			// console.log(responseObj.id)
			callback(responseObj.id)
		})
		.catch(err => console.error(err))
}
