const fs        = require('fs-extra')
const clc       = require('cli-color')
const os        = require('os')

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

// Create folders
let projectsPath = config.location.projects
if (projectsPath[0] === '~') {
	projectsPath = projectsPath.replace('~', os.homedir())
}

let filePath = projectsPath + config.projectName + '/' + config.files[0]
// let filePath = '~/' + config.projectName + '/' + config.files[0]
fs.createFileSync(filePath, (err) => {
	console.log( color.error(err) );
})

let accessContent = `## ftp
host:
path:
user:
password:

## database
host: localhost
dbname:
user:
password:
`;

fs.writeFileSync(filePath, accessContent, (err) => {
	console.log( color.error(err) );
})
console.log(
	'\n' +
	'File',
	color.file(config.projectName + '/' + config.files[0]),
	'is created'
)

console.log(
	color.success('Success.'),
	'\n'
)

// Create files
