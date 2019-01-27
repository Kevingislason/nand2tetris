const fs = require('fs');
const path = require('path');

//Pre-set memory addresses, user-defined line labels (Li= instructions),
//and user defined variables
const symbols = {
  SP: 0,
  LCL: 1,
  ARG: 2,
  THIS: 3,
  THAT: 4,
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
  R4: 4,
  R5: 5,
  R6: 6,
  R7: 7,
  R8: 8,
  R9: 9,
  R10: 10,
  R11: 11,
  R12: 12,
  R13: 13,
  R14: 14,
  R15: 15,
  SCREEN: 0x4000,
  KBD: 0x6000,
};
//ALU mnemonics
const cInstructionCodes = {
  comp: {
    '0': '0101010',
    '1': '0111111',
    '-1': '0111010',
    D: '0001100',
    A: '0110000',
    '!D': '0001101',
    '!A': '0110001',
    '-D': '0001111',
    '-A': '0110011',
    'D+1': '0011111',
    'A+1': '0110111',
    'D-1': '0001110',
    'A-1': '0110010',
    'D+A': '0000010',
    'D-A': '0010011',
    'A-D': '0000111',
    'D&A': '0000000',
    'D|A': '0010101',
    M: '1110000',
    '!M': '1110001',
    '-M': '1110011',
    'M+1': '1110111',
    'M-1': '1110010',
    'D+M': '1000010',
    'D-M': '1010011',
    'M-D': '1000111',
    'D&M': '1000000',
    'D|M': '1010101',
  },
  dest: {
    '': '000',
    M: '001',
    D: '010',
    MD: '011',
    A: '100',
    AM: '101',
    AD: '110',
    AMD: '111',
  },
  jump: {
    '': '000',
    JGT: '001',
    JEQ: '010',
    JGE: '011',
    JLT: '100',
    JNE: '101',
    JLE: '110',
    JMP: '111',
  },
};

//Removes comments, empty lines, and whitespace from incoming file
//Returns an array of every separate command
function clean(file) {
  return (
    file
      .split('\n')
      //First "replace" removes whitespace, second removes comments
      .map(command => command.replace(/\s/g, '').replace(/\/\/.*$/, ''))
      //Removes blank lines
      .filter(command => command.length > 0)
  );
}

function recordLSymbols(commands) {
  //L instructions get removed later and don't count towards total line number
  let lineNumber = 0;
  commands.forEach(command => {
    if (isLCommand(command)) {
      recordLSymbol(command, lineNumber);
    } else {
      lineNumber++;
    }
  });
}
//Records an individual symbol, checks for illegal assignments
function recordLSymbol(symbol, lineNumber) {
  symbol = symbol.slice(1, symbol.length - 1);
  if (symbols[symbol]) {
    throw `Error: The label '${symbol}' cannot be assigned more than once`;
  } else {
    symbols[symbol] = lineNumber;
  }
}
//Removes L commands after we've recorded them
function removeLCommands(commands) {
  return commands.filter(command => !isLCommand(command));
}

//For more readable code
function isLCommand(command) {
  return command[0] === '(' && command[command.length - 1] === ')';
}

//The soul of the assembler here
function translateToMachineLanguage(assembleyProgram) {
  return assembleyProgram.map(command => {
    if (command[0] === '@') {
      return translateAInstruction(command);
    } else {
      return translateCInstruction(command);
    }
  });
}

let lowestFreeROMAddress = 16;
//Checks if symbol has an associated num; if not, assigns it to lowest free ROM address
function lookupSymbol(symbol) {
  if (symbols[symbol] === undefined) {
    symbols[symbol] = lowestFreeROMAddress;
    lowestFreeROMAddress++;
  }
  return symbols[symbol];
}
//'@xyz' -> 16 bit binary code (leading 0 plus 15 digits)
function translateAInstruction(command) {
  command = command.slice(1);
  let decimal = isNaN(parseInt(command, 10))
    ? lookupSymbol(command)
    : parseInt(command, 10);
  const MAX_INT = 32767;
  if (decimal > MAX_INT) {
    throw new Error(`Overflow error: ${decimal} exceeds max value`);
  }
  let binary = decimal.toString(2);
  //add leading zeroes
  while (binary.length < 16) {
    binary = '0' + binary;
  }
  return binary;
}

//The C instruction may contain an assignment, a calculation, and/or a jump
function translateCInstruction(command) {
  //We separate all of these with inelegant string manupulation
  const destMnemonic =
    command.indexOf('=') === -1 ? '' : command.slice(0, command.indexOf('='));
  const jumpMnemonic =
    command.indexOf(';') === -1 ? '' : command.slice(command.indexOf(';') + 1);
  const compMnemonic = destMnemonic
    ? command.split(/;|=/)[1]
    : command.split(/;|=/)[0];

  //We look up what codes our instructions correspond to and return a 16bit bin command
  return (
    '111' +
    lookupMnemonic(compMnemonic, 'comp') +
    lookupMnemonic(destMnemonic, 'dest') +
    lookupMnemonic(jumpMnemonic, 'jump')
  );
}
//Checks if a mnemonic is valid; if so, returns equivalent binary
function lookupMnemonic(mnemonic, type) {
  let bin = cInstructionCodes[type][mnemonic];
  if (!bin) {
    throw new Error(`${mnemonic} is not a valid instruction`);
  }
  return bin;
}

//Open file & note path
const assembleyFile = fs.readFileSync(process.argv[2]).toString();
const assemblyFilePath = path.normalize(
  path.join(process.cwd(), process.argv[2])
);

//Remove whitespace and comments
let assembleyCommands = clean(assembleyFile);
//Record and then remove all the line labels
recordLSymbols(assembleyCommands);
assembleyCommands = removeLCommands(assembleyCommands);
//Translate to machine language
const machineLanguageCommands = translateToMachineLanguage(assembleyCommands);
const machineLanguageFile = machineLanguageCommands.join('\n');

//Output hack file
fs.writeFileSync(
  assemblyFilePath.replace('asm', 'hack'),
  machineLanguageFile,
  'utf8'
);
