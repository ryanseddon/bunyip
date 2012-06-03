var exec = require('child_process').exec,
	program = require('./options'),
	config = require("./config"),
	tunnel;

var create = function(){
		// Hook up ssh tunnel to yeti hub
		tunnel = exec('pagekite.py ' + program.port + ' ' + config.tunnellink);
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