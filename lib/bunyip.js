#!/usr/bin/env node
/*
 * bunyip
 * http://ryanseddon.github.com/Bunyip
 *
 * Copyright (c) 2012 Ryan Seddon
 * Licensed under the MIT license.
 */

var util = require('util'),
	config = require("./config"),
	helpers = require("./helpers"),
	yeti = require("../node_modules/yeti/lib/cli").route,
	fs = require("fs"),
	browserstack = require("browserstack"),
	tunnel = require("./tunnel");

var timeout = config.browserstack.timeout || 480, // 8 minutes
	client = browserstack.createClient(config.browserstack),
	platforms = /^(all|ios|win|mac|android|opera)$/;

exports.route = function(program) {
	if(program.port) {
		var url = "http://localhost:"+program.port;
		config.port = program.port;
	}

	if(program.status) {
		client.getWorkers(function(err, workers) {
			var running = [],
				queued = [];

			workers.forEach(function(worker, i) {
				if(worker.status === "running") {
					running.push((worker.browser || worker.device) + " - " + worker.version + " ("+worker.id+") ");
				} else if(worker.status === "queue") {
					queued.push((worker.browser || worker.device) + " - " + worker.version + " ("+worker.id+") ");
				}
			});

			console.log("Running:\n\t" + running.join("\n\t"));
			console.log("Queued:\n\t" + queued.join("\n\t"));
		});
	} else if(program.available) {
		helpers.availableBrowsers(function(browsers){
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
			helpers.killBrowsers();
		} else {
			helpers.killBrowser(program.kill, function(err, data, id){
				console.log("Worker %s successfully killed, it ran for %ss", id, Math.round(data.time));
			});
		}
	} else {
		yeti(["","", program.file, "--port=" + program.port]);

		tunnel.create();

		process.nextTick(function () {
			var testURL = "http://"+config.tunnellink,
				browsers = [],
				file = false;

			if(program.browsers && !platforms.test(program.browsers)) {
				try {
					file = fs.readFileSync(program.browsers,'utf8');
				} catch(e) {}
				
				if(file) {
					// You can pass in a JSON file specifying the browsers
					browsers = JSON.parse(file);
					
					browsers.forEach(function(browser,i) {
						browser.url = testURL;
						browser.timeout = timeout;
					});
				} else {
					var opt = program.browsers.split('|'),
						versions, os, platform, data;

					opt.forEach(function(browser,i) {
						data = browser.split("/");
						platform = data[0].split(":");
						browser = platform[0];
						os = platform[1];
						versions = data[1].split(',');

						versions.forEach(function(ver, i) {
							browsers.push({
								browser: browser,
								device:  browser,
								os: os,
								version: ver,
								url: testURL,
								timeout: timeout
							});
						});
					});
				}
				
				process.nextTick(function() {
					helpers.loadBrowsers(browsers);
				});
			} else if(platforms.test(program.browsers)) {
				
				if(program.browsers === "all") {
					helpers.availableBrowsers(function(list){
						list.forEach(function(browser, i) {
							browser.url = testURL;
							browser.timeout = timeout;
						});

						helpers.loadBrowsers(list);
					});
				} else {
					helpers.platformBrowsers(program.browsers);
				}
			}
		});

		process.on('exit', function () {
			tunnel.destroy();
		});
	}
};