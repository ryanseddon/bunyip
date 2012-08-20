var exec = require('child_process').exec,
	program = require('./options'),
	tunnel;

var create = function(config) {
		config.tunnel = config.tunnel.replace("<port>", config.port);
		// Hook up ssh tunnel to yeti hub
		tunnel = exec(config.tunnel);
	},

	destroy = function() {
		// Clean up processes on exit
		try {
			tunnel.kill('SIGHUP');
		} catch(e) {}
	};

module.exports = {
	create: create,
	destroy: destroy
};