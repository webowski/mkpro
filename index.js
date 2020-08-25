const fs        = require('fs-extra')
const clc       = require('cli-color')
const os        = require('os')
const path      = require('path')

const config    = JSON.parse(fs.readFileSync('config.json', 'utf8'))

const color = {
	file: clc.xterm(69),
	success: clc.xterm(47),
	exclaim: clc.xterm(226),
	warning: clc.xterm(1),
	error: clc.xterm(9),
	muted: clc.xterm(242)
}

const bold = clc.bold

let projectLocation = config.project.location
if (projectLocation[0] === '~') {
	projectLocation = projectLocation.replace('~', os.homedir())
}
let projectName = config.project.name

// Create folders
let folders = config.project.folders
folders.forEach( folder => {
	fs.mkdirsSync(path.join(projectLocation, projectName, folder), (err) => {
		console.log( color.error(err) )
	})
})

// Create files
var files = []

config.project.files.forEach(file => {
	file = path.join(projectLocation, projectName, file)
	files.push(file)
})

let editorProjectFile = path.join(projectLocation, projectName, projectName + '.sublime-project')
files.push(editorProjectFile)

let filePath = path.join(projectLocation, projectName, config.project.files[0])

// let filePath = path.join('~/', projectName, config.project.files[0])
files.forEach(file => {
	fs.createFileSync(file, (err) => {
		console.log( color.error(err) )
	})
})

let accessContent = `## ftp
host:
path:
user:
password:

## Database
host: localhost
dbname:
user:
password:
`

let editorProjectContent = `{
	"folders":
	[
		{
			"path": "."
		},
		{
			"path": "~/vhosts/${projectName}",
			"name": "working-copy"
		}
	]
}
`

fs.writeFileSync(editorProjectFile, editorProjectContent, (err) => {
	console.log( color.error(err) );
})

console.log(
	'\n' +
	'File',
	color.file(editorProjectFile),
	'is created'
)

fs.writeFileSync(filePath, accessContent, (err) => {
	console.log( color.error(err) );
})

console.log(
	'File',
	color.file(projectName + '/' + config.project.files[0]),
	'is created'
)

console.log(
	color.success('Success'),
	'\n'
)

