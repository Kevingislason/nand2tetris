function parse(vmFiles) {
  return (
    vmFiles
      .map(file =>
        file.contents
          //I have to split on both r and n because the text files that came with this
          //project are weird and have both for some annoying reason
          .split('\r')
          .join('')
          .split('\n')
          //remove comments
          .map(command => command.replace(/\/\/.*$/, ''))
          //Removes blank lines
          .filter(command => command.length > 0)
          //Format every command as an JS object, where we can access its type and arguments
          .map(command => ({
            //The .vm file the command is from
            fileName: file.name,
            type: getType(command),
            arg1: getArg1(command),
            arg2: getArg2(command),
            text: command,
          }))
      )
      //flatten the resultant 2D array (Javascript ought to  have a flatten method smh)
      .reduce((a, b) => a.concat(b))
  );
}

function getType(command) {
  let commandFirstWord = command.split(' ')[0];

  //{command's first word: what type the command is}
  const commandTypes = {
    pop: 'pop',
    push: 'push',
    label: 'label',
    goto: 'goto',
    'if-goto': 'if',
    function: 'function',
    return: 'return',
    call: 'call',
    add: 'arithmetic',
    sub: 'arithmetic',
    neg: 'arithmetic',
    eq: 'arithmetic',
    gt: 'arithmetic',
    lt: 'arithmetic',
    and: 'arithmetic',
    or: 'arithmetic',
    not: 'arithmetic',
  };
  return commandTypes[commandFirstWord];
}

function getArg1(command) {
  return command.split(' ')[1] ? command.split(' ')[1] : null;
}
function getArg2(command) {
  return command.split(' ')[1] ? parseInt(command.split(' ')[2], 10) : null;
}

module.exports = { parse };
