var program = require('commander'),
	fs = require('fs');

program
  .version('0.2.1')
  .option('-f, --file <file>', 'specify the html testsuite to run')
  .option('-p, --port <port>', 'specify the port [9000]', Number)
  .option('-b, --browsers <ie:win/6.0 || file.json>', 'specify browsers to test in e.g "ie:win/6.0,7.0|iPhone 3GS:ios/3.0"', String)
  .option('-a, --available', 'returns available browsers on browserstack')
  .option('-s, --status', 'get status of all browserstack browser')
  .option('-k, --kill <id>', 'kill browserstack worker process')
  .option('-c, --cdir <path>', 'specify path to config.js file', String);

/* Config file setup */
program
	.command('config [path]')
	.description('create config.js file and save it at [path]')
	.action(function(path){
		program
			.prompt({
				username: 'BrowserStack username: ',
				password: 'BrowserStack password: ',
				domain: 'Localhost tunnel subdomain e.g. bunyip.pagekite.me: ',
				cmd: 'Localhost tunnel command e.g. pagekite.py or show: '
			}, function(opts) {
				var config = {
					browserstack: {
						username: opts.username,
						password: opts.password,
						timeout: 480
					},
					port: 9000,
					tunnellink: opts.domain,
					tunnel: opts.cmd + " <port> " + opts.domain
				};

				var configuration = JSON.stringify(config, null, 4),
					js = "var config = " + configuration + ";\n\nmodule.exports = config;";

				fs.writeFile((path || ""), js, 'utf8', function(err) {
					if(err) {
						return console.log(err);
					}
					console.log("Config file successfully created!");
				});

				process.stdin.destroy();
			});
	});

program
	.command('local')
	.description('working with local installed browsers')
	.option('-l, --launch <browsers>", "launch specific browser(s) e.g. firefoxnightly|chromecanary', String)
	.action(function(cmd, opts){
		cmd.isSet = true;
	});

program.parse(process.argv);

module.exports = program;