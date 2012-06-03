var program = require('commander');

program
  .version('0.1.0')
  .option('-f, --file <file>', 'specify the html testsuite to run', 'index.html')
  .option('-p, --port <port>', 'specify the port [9000]', Number, 9000)
  .option('-b, --browsers <ie:win/6.0 || file.json>', 'specify browsers to test in e.g "ie:win/6.0,7.0|iPhone 3GS:ios/3.0"', String)
  .option('-a, --available', 'returns available browsers on browserstack')
  .option('-s, --status', 'get status of all browserstack browser')
  .option('-k, --kill <id>', 'kill browserstack worker process')
  .parse(process.argv);

module.exports = program;