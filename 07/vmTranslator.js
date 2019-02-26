const { parse } = require('./parse.js');
const { writeAssembley } = require('./writeAssembley.js');
const fs = require('fs');
const path = require('path');

//Check for correct usage
if (process.argv.length <= 2) {
  console.log('Usage: ' + __filename + ' path/to/directory');
  process.exit(-1);
}

//vm Path is the absolute path to the second CLI argument, a directory or a .vm file
const vmPath = path.normalize(path.join(process.cwd(), process.argv[2]));

//'vmFiles' is an array of .vm files formatted as JS objects
//Each file looks like this: {contents: '@SP\nM=M+1\n...', name: 'someFile.vm')}
let vmFiles = [];

//Are we dealing with a directory or a single .vm program?
const isDirectory = fs.lstatSync(vmPath).isDirectory();

//Fills up VM array, based on whether or not we're dealing w/ a dir or a single file
if (isDirectory) {
  let directoryContents = fs.readdirSync(vmPath);
  for (let i = 0; i < directoryContents.length; i++) {
    let vmFileName = directoryContents[i];
    let vmFileContents = fs.readFileSync(vmPath + '/' + vmFileName).toString();
    vmFiles.push({ contents: vmFileContents, name: vmFileName.slice(0, -3) });
  }
} else {
  let vmFileContents = fs.readFileSync(vmPath).toString();
  let vmFileName = process.argv[2];
  vmFiles.push({ contents: vmFileContents, name: vmFileName.slice(0, -3) });
}

const vmCommands = parse(vmFiles);

const asmFile = writeAssembley(vmCommands);

const asmPath = vmPath.replace(/\.vm$/, '.asm');

fs.writeFileSync(asmPath, asmFile, 'utf8');
