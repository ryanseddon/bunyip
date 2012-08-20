var browserstack = require("browserstack"),
	fs = require("fs");

/*
	Code heavily influenced by jayarjo's fork
	https://github.com/jayarjo/bunyip/blob/master/lib/browserstack.js
*/

function BrowserStack(config) {
	var workers = [],
		bs = config.browserstack,
		tunnellink = config.tunnellink,
		timeout = bs.timeout || 480, // 8 minutes
		client = browserstack.createClient(bs),
		platforms = /^(all|ios|win|mac|android|opera)$/,
		osMap = {},

	loadBrowsers = function(browsers) {
		browsers.forEach(function(browser, idx){
			client.createWorker(browser, function(err, worker){
				if(err) {
					console.log(err);
					console.log("Whoops! BrowserStack failed to create a worker: %s", err);
				} else {
					console.log("  BrowserStack "+ (browser.browser || browser.device) + " " + browser.version +" worker launched: %s", worker.id);
					workers.push(worker.id);
				}
			});
		});
	},
	availableBrowsers = function(cb) {
		client.getBrowsers(function(err, browsers){
			if(!err) {
				cb(browsers);
			}

			console.log(err);
		});
	},
	killBrowser = function(id, cb) {
		client.terminateWorker(id, function(err, data) {
			if(cb) {
				cb(err, data);
			}
		});
	},
	killBrowsers = function() {
		client.getWorkers(function(err, workers) {
			workers.forEach(function(worker, i) {
				killBrowser(worker.id, function(err, data) {
					console.log("Worker %s successfully killed, it ran for %ss", this, Math.round(data.time));
				}.bind(worker.id));
			});
		});
	},
	getWorkers = function() {
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
	},
	manageBrowsers = function (program) {
		var testURL = "http://"+config.tunnellink,
			timeout = bs.timeout,
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
			
			this.loadBrowsers(browsers);
		} else if(platforms.test(program.browsers)) {
			
			if(program.browsers === "all") {
				this.availableBrowsers(function(list){
					list.forEach(function(browser, i) {
						browser.url = testURL;
						browser.timeout = timeout;
					});

					this.loadBrowsers(list);
				});
			} else {
				this.platformBrowsers(program.browsers);
			}
		}
	},
	platformBrowsers = function(os) {
		osMap = {};

		availableBrowsers(function(browsers) {
			browsers.forEach(function(browser, i) {
				if(!osMap[browser.os]) {
					osMap[browser.os] = [];
				}
				osMap[browser.os].push({
					browser: browser.browser || "",
					device: browser.device || "",
					version: browser.version,
					os: browser.os,
					url: "http://" + config.tunnellink,
					timeout: timeout
				});
			});

			loadBrowsers(osMap[os]);
		});
	};

	this.loadBrowsers		= loadBrowsers;
	this.availableBrowsers	= availableBrowsers;
	this.killBrowser		= killBrowser;
	this.killBrowsers		= killBrowsers;
	this.getWorkers			= getWorkers;
	this.manageBrowsers		= manageBrowsers;
	this.platformBrowsers	= platformBrowsers;
}

module.exports = BrowserStack;