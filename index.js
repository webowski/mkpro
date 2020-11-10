// Tools
// -----------------------------------

const fs           = require('fs-extra')
const clc          = require('cli-color')
const os           = require('os')
const path         = require('path')
const AdmZip       = require('adm-zip')
const fetch        = require('node-fetch')
const readdirp     = require('readdirp')

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


tools.createBoard = require('./trello.js')(tools)


// Project folder
// -----------------------------------

let projectLocation = config.project.location
if (projectLocation[0] === '~') {
	projectLocation = projectLocation.replace('~', tools.os.homedir())
}
let projectName = config.project.name
let projectPath = tools.path.join( projectLocation, projectName )


// if folder is exists
if (tools.fs.existsSync( projectPath )) {
    console.log(
		tools.color.error('Error.'),
		'The project folder already exists',
		tools.color.file( projectPath ),
	)
	// return false
}

// Make project folder
tools.fs.mkdirsSync( projectPath, err => {
	console.log(
		color.error(err)
	)
})


// The project folder blank
// -----------------------------------

// var fileUrl = config.project.blank;

// request.get({url: fileUrl, encoding: null}, (err, res, body) => {

  // var zip = new AdmZip(body);
  // var zipEntries = zip.getEntries();
  // console.log(zipEntries.length);

  // zipEntries.forEach((entry) => {
  //   if (entry.entryName.match(/readme/i))
  //     console.log(zip.readAsText(entry));
  // });

// });

let blankArchiveUrl = config.project.blank

downloadFile( blankArchiveUrl, filepath => {

	unpackArchive(filepath, () => {

		// https://github.com/paulmillr/readdirp
		readdirp( projectPath , {
			fileFilter: [
				'.keep',
				'README.md',
			],
			alwaysStat: true
		} )
			.on('data', (entry) => {
				const {path, stats: {size}} = entry;
				console.log(`${JSON.stringify({path, size})}`);
			})
			// Optionally call stream.destroy() in `warn()` in order to abort and cause 'close' to be emitted
			.on('warn', error => console.error('non-fatal error', error))
			.on('error', error => console.error('fatal error', error))
			.on('end', () => {
				console.log('done')
				removeFile( filepath )
			})

	})
})


// !!!!!!!!!!!!!!!!!!1
// ТАК СТОП
console.log( 'done' )
return false


// // Sublime text project file
// // -----------------------------------

// let editorProjectFile = tools.path.join(projectPath, projectName + '.sublime-project')
// files.push(editorProjectFile)

// let filePath = tools.path.join(projectLocation, projectName, config.project.files[0])

// // let filePath = tools.path.join('~/', projectName, config.project.files[0])
// files.forEach(file => {
// 	tools.fs.createFileSync(file, (err) => {
// 		console.log( color.error(err) )
// 	})
// })

// let editorProjectContent = `{
// 	"folders":
// 	[
// 		{
// 			"path": "."
// 		},
// 		{
// 			"path": "~/vhosts/${projectName}",
// 			"name": "working-copy"
// 		}
// 	]
// }
// `

// tools.fs.writeFileSync(editorProjectFile, editorProjectContent, (err) => {
// 	console.log( color.error(err) );
// })

// console.log(
// 	'\n' +
// 	'File',
// 	color.file(editorProjectFile),
// 	'is created'
// )


// // Trello board
// // -----------------------------------

// tools.createBoard( tools )


// // End
// // -----------------------------------

// console.log(
// 	color.success('Success'),
// 	'\n'
// )



// Functions
// -----------------------------------

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

		let fileName = path.basename(zipEntry.entryName)

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

		// if ( fileName === '.keep' ) {
		// 	fs.removeSync(
		// 		path.join(entryTargetDir, fileName)
		// 	)
		// }
	})

	console.log(
		tools.color.file( path.basename(filepath) ),
		'is unpacked',
	)

	if (typeof callback === "function") callback()
}
