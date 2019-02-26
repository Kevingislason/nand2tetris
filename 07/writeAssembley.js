//We need to keep track of how many lines of assembley we've written
//This is relevant for the comparison operations: 'eq' 'lt' ang 'gt'
//See the writeComparison function below
let numberOfLines = 0;

function writeAssembley(vmCommands) {
  return vmCommands
    .map(command => {
      let assembleyCommands;
      if (command.type === 'arithmetic') {
        assembleyCommands = writeArithmetic(command);
      } else if (command.type === 'push') {
        assembleyCommands = writePush(command);
      } else if (command.type === 'pop') {
        assembleyCommands = writePop(command);
      }
      numberOfLines += assembleyCommands.split('\n').length - 1;
      return assembleyCommands;
    })
    .join('\n');
}

function writePush(command = null) {
  //default: pushes contents of the D register; used to help build other .vm commands
  if (command === null) {
    return '@SP\nA=M\nM=D\n@SP\nM=M+1\n';
  }
  //If we're just pushing a constant e.g. 'push 2' or 'push constant 2'...
  else if (command.arg2 === null || command.arg1 === 'constant') {
    const number = command.arg2 !== null ? command.arg2 : command.arg1;
    return `@${number}\nD=A\n@SP\nA=M\nM=D\n@SP\nM=M+1\n`;
    //Otherwise if we're pushing a  variable...
  } else {
    return writePushFromVariable(command);
  }
}

//If we're pushing a variable onto the stack instead of a simple constant...
function writePushFromVariable(command) {
  switch (command.arg1) {
    case 'temp': //Temp begins at RAM[5]
      return `@${5 + command.arg2}\nD=M\n@SP\nA=M\nM=D\n@SP\nM=M+1\n`;
    case 'pointer': //Pointer begins at RAM[3]
      return `@${3 + command.arg2}\nD=M\n@SP\nA=M\nM=D\n@SP\nM=M+1\n`;
    case 'static':
      return (
        //Static variables are in .asm are prefixed by their .vm filename
        `@${command.fileName}.${command.arg2}\n` +
        'D=M\n@SP\nA=M\nM=D\n@SP\nM=M+1\n'
      );
    //These last four cases all have the form:
    //1. Get the base address that this segment points to
    //2. Add the offset (e.g. 2 in 'push argument 2')
    //3. Put the contents of this address on the stack
    case 'this':
      return (
        '@THIS\nD=M\n@' +
        `${command.arg2}\nA=D+A\nD=M\n@SP\nA=M\nM=D\n@SP\nM=M+1\n`
      );
    case 'that':
      return (
        '@THAT\nD=M\n@' +
        `${command.arg2}\nA=D+A\nD=M\n@SP\nA=M\nM=D\n@SP\nM=M+1\n`
      );
    case 'local':
      return (
        '@LCL\nD=M\n@' +
        `${command.arg2}\nA=D+A\nD=M\n@SP\nA=M\nM=D\n@SP\nM=M+1\n`
      );
    case 'argument':
      return (
        '@ARG\nD=M\n@' +
        `${command.arg2}\nA=D+A\nD=M\n@SP\nA=M\nM=D\n@SP\nM=M+1\n`
      );
    default:
      console.error('Error in push command');
  }
}

//By default writePop stores the popped value in the D register, (but this can be disabled)
function writePop(command = null, options = { storePoppedValue: true }) {
  let assembleyCommands = '@SP\nM=M-1\n';

  if (options.storePoppedValue === true) {
    assembleyCommands += 'A=M\nD=M\n';
  }
  //If we're storing the popped value in a variable...
  if (command) {
    assembleyCommands += writePopToVariable(command);
  }

  return assembleyCommands;
}

//If we're storing a popped value in a variable...
function writePopToVariable(command) {
  switch (command.arg1) {
    case 'temp':
      return `@${5 + command.arg2}\nM=D\n`; //temp begins at RAM[5]
    case 'pointer':
      return `@${3 + command.arg2}\nM=D\n`; //pointer begins at RAM[3]
    case 'static': //Static variables are in .asm are prefixed by their .vm filename
      return `@${command.fileName}.${command.arg2}\nM=D\n`;
    //The last four cases all have this form:
    //1.Segments point to some address. Add this base address to the offset (i.e arg2)
    //2. Save this address for later. We put it in RAM[13], which isn't used for anything else
    //3.Get the 'popped' value, i.e. whatever SP is pointing to, and put it in D
    //4. Retreive our address from RAM[13] and fill that address w/ contents of D register
    case 'this':
      return (
        '@THIS\nD=M\n' +
        `@${command.arg2}\nD=A+D\n@13\nM=D\n@SP\nA=M\nD=M\n@13\nA=M\nM=D\n`
      );
    case 'that':
      return (
        '@THAT\nD=M\n' +
        `@${command.arg2}\nD=A+D\n@13\nM=D\n@SP\nA=M\nD=M\n@13\nA=M\nM=D\n`
      );
    case 'local':
      return (
        '@LCL\nD=M\n' +
        `@${command.arg2}\nD=A+D\n@13\nM=D\n@SP\nA=M\nD=M\n@13\nA=M\nM=D\n`
      );
    case 'argument':
      return (
        '@ARG\nD=M\n' +
        `@${command.arg2}\nD=A+D\n@13\nM=D\n@SP\nA=M\nD=M\n@13\nA=M\nM=D\n`
      );
    default:
      console.error('Error in push command');
  }
}

function writeArithmetic(command) {
  if (command.text === 'eq' || command.text === 'gt' || command.text === 'lt') {
    //these operations are more complicated since we need to jump; will deal w/ them seperately
    return writeComparison(command);
  }

  //assembley commands that are unique to particular VM arithmetic commands
  const operations = {
    //These first four commands are preceded by two pops
    //First popped value is in D, second is pointed to by the stack pointer
    add: 'A=M\nD=D+M\n',
    sub: 'A=M\nD=M-D\n',
    and: 'A=M\nD=D&M\n',
    or: 'A=M\nD=D|M\n',
    //These last two commands are preceded by one pop
    //This popped value is in D
    neg: 'D=-D\n',
    not: 'D=!D\n',
  };

  //if command  pops 1 value
  if (command.text === 'neg' || command.text === 'not') {
    return writePop() + operations[command.text] + writePush();
    //if command pops 2 values
  } else {
    //we don't want to overwrite first pop in D register
    const secondPopOptions = { storePoppedValue: false };
    return (
      writePop() +
      writePop(null, secondPopOptions) +
      operations[command.text] +
      writePush()
    );
  }
}

function writeComparison(command) {
  //Assembley commands that are unique to particular VM comparison commands:
  const operations = {
    eq: 'D;JEQ\n',
    lt: 'D;JLT\n',
    gt: 'D;JGT\n',
  };
  //since we don't want to overwrite first pop in D register...
  const secondPopOptions = { storePoppedValue: false };

  //Based on whether or not the comparison succeeds, we have jump ahed in the ASM code.
  //13 or 14 = the number of .asm lines from the beginning of the comparison command...
  //to the line that assigns TRUE or FALSE (respectively)
  const assignTrueAddress = numberOfLines + 13;
  const assignFalseAddress = numberOfLines + 14;

  return (
    writePop() +
    writePop(null, secondPopOptions) +
    //Now we subtract the terms we popped from the stack
    'A=M\nD=M-D\n' +
    //If the comparison succeeds, we'll jump to code where D register will be assigned TRUE
    `@${assignTrueAddress}\n` +
    //The jump condition  will vary depending on which compaison we perform
    operations[command.text] +
    //If JMP condition IS NOT met, we just proceed and fill D register with FALSE i.e. 0...
    'D=0\n' +
    //...and we jump past the code that assigns true.
    `@${assignFalseAddress}\n0;JMP\n` +
    //If the JMP condition IS met, we jump to to this line and load TRUE (-1) into D register
    'D=-1\n' +
    //Now have either TRUE or FALSE in the D register and push it onto the stack
    writePush()
  );
}

module.exports = { writeAssembley };
