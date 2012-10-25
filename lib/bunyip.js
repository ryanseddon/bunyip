#!/usr/bin/env node
/*
 * bunyip
 * http://ryanseddon.github.com/Bunyip
 *
 * Copyright (c) 2012 Ryan Seddon
 * Licensed under the MIT license.
 */

var util = require('util'),
	yeti = require("../node_modules/yeti/lib/cli"),
	fs = require("fs"),
	BrowserStack = require("./browserstack"),
	LocalBrowsers = require("./localbrowsers"),
	tunnel = require("./tunnel");

var config, bs, lb,
	browserstack = false,
	local = false;

exports.route = function(program) {
	if(program.cdir) {
		if(program.cdir.indexOf("/") !== -1) {
			// Absolute path specified e.g. -c /Users/Name/config.js
			config = require(program.cdir);
		} else {
			// Relative to cwd e.g. -c config.js
			config = require(process.cwd() + "/" + program.cdir);
		}
	} else {
		try {
			// Default to current working directory and default name of config.js
			config = require(process.cwd() + "/config.js");
		} catch(e){}
	}

	if(program.port) {
		var url = "http://localhost:"+program.port;
		
		if(config) {
			config.port = program.port;
			config.tunnel = config.tunnel.replace("9000", config.port);
		}
	} else {
		program.port = 9000;
	}
	
	if(program.status || program.available || program.browsers || program.kill) {
		bs = new BrowserStack(config);
		browserstack = true;
	}

	if(program.status) {
		bs.getWorkers();
	} else if(program.available) {
		bs.availableBrowsers(function(browsers){
			var list = "",
				browser,
				device = {},
				curBrowser;

			for (var i = 0; i < browsers.length; i++) {
				curBrowser = browsers[i];

				if(curBrowser.device) {
					if(curBrowser.device === device.platform || curBrowser.version === device.version) {
						list += " " + curBrowser.device  + ", ";
					} else {
						list += "\n" + curBrowser.os + " "+ curBrowser.version + ": " + curBrowser.device + ",";
					}
				} else if(curBrowser.browser === browser) {
					list += " " + curBrowser.version  + ", ";
				} else {
					list += "\n" + curBrowser.browser + " ("+ curBrowser.os + "): " + curBrowser.version + ", ";
				}

				browser = curBrowser.browser;
				device = {
					platform: curBrowser.device,
					version: curBrowser.version
				};

			}

			console.log(list);
		});
	} else if(program.kill) {
		if(program.kill ==="all") {
			bs.killBrowsers();
		} else {
			bs.killBrowser(program.kill, function(err, data){
				console.log("Worker %s successfully killed, it ran for %ss", this, Math.round(data.time));
			}.bind(program.kill));
		}
	} else if(program.file) {
		try {
			var yetiConf = {
				stdin: process.stdin,
				stdout: process.stdout,
				stderr: process.stderr,
				exitFn: process.exit
			};
			var cli = new yeti.CLI(yetiConf);
			cli.route(["","", program.file, "--port=" + program.port]);

		} catch(e) {
			console.log(e);
		}

		if(config) {
			tunnel.create(config);
		}

		if(browserstack) {
			bs.manageBrowsers(program);
		}

		process.nextTick(function(){
			program.commands.forEach(function(cmd, i){
				// cmd.isSet idea taken from https://github.com/jayarjo/bunyip/
				if(cmd.isSet) {
					if(cmd.name === "local") {
						lb = new LocalBrowsers(config, program.port);
						lb.launchBrowsers(cmd.launch);
						process.on('exit', lb.exitBrowsers);
					}
				}
			});
		});

		process.on('exit', function () {
			tunnel.destroy();
		});
	}
};

// Handle exceptions that 99% time are to do with a missing config file.
//process.on('uncaughtException', function (err) {
//	console.log("An error occured most likely to do with the config file, see 'bunyip -h' for more info.");
//	console.dir(err);
//});