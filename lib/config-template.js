var config = config || {};

config.browserstack = {
	username: "", // Your BrowserStack username
	password: "", // Your BrowserStack password
	version: 2
};

// The tunneling service I use is https://pagekite.net/support/quickstart/ 
// You can easily use another service lke showoff.io only requirement is that you can specify a fixed url name
config.port = " 9000 ";
config.tunnellink = "bunyip.pagekite.me/";
// This is the command that nodejs will execute using child_process.exec
config.tunnel = "pagekite.py" + config.port + config.tunnellink;

module.exports = config;