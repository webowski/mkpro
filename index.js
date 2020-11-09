// Tools
// -----------------------------------

const tools = {
	fs:            require('fs-extra'),
	clc:           require('cli-color'),
	os:            require('os'),
	path:          require('path'),
	config:        require('./config.json'),
}

// Config special
let configSpecial = JSON.parse(`{
	"trello": {
		"key": "",
		"token": ""
	}
}`)

try {
	configSpecial = require('./config-special.json')
} catch (error){
	console.error( error )
}

tools.config = { ...configSpecial, ...tools.config }
const config = tools.config


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
	return false
}

// Make project folder
tools.fs.mkdirsSync( projectPath, err => {
	console.log(
		color.error(err)
	)
})


// The project folder blank
// -----------------------------------



// !!!!!!!!!!!!!!!!!!1
// ТАК СТОП
return false


// Sublime text project file
// -----------------------------------

let editorProjectFile = tools.path.join(projectPath, projectName + '.sublime-project')
files.push(editorProjectFile)

let filePath = tools.path.join(projectLocation, projectName, config.project.files[0])

// let filePath = tools.path.join('~/', projectName, config.project.files[0])
files.forEach(file => {
	tools.fs.createFileSync(file, (err) => {
		console.log( color.error(err) )
	})
})

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

tools.fs.writeFileSync(editorProjectFile, editorProjectContent, (err) => {
	console.log( color.error(err) );
})

console.log(
	'\n' +
	'File',
	color.file(editorProjectFile),
	'is created'
)


// Trello board
// -----------------------------------

tools.createBoard( tools )


// End
// -----------------------------------

console.log(
	color.success('Success'),
	'\n'
)
