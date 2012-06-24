var browserstack = require("browserstack"),
	config = require("./config");

var workers = [],
	timeout = config.browserstack.timeout || 480, // 8 minutes
	client = browserstack.createClient(config.browserstack),
	osMap = {};

var	loadBrowsers = function(browsers) {
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
		client.terminateWorker(id, function(err, data, id) {
			if(cb) {
				cb(err, data, id);
			}
		});
	},

	killBrowsers = function() {
		client.getWorkers(function(err, workers) {
			var ids = [];

			workers.forEach(function(worker, i){
				ids.push(worker.id);
			});

			ids.forEach(function(id, i){
				killBrowser(id, function(err, data, id){
					console.log("Worker %s successfully killed, it ran for %ss", id, Math.round(data.time));
				});
			});
		});
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

module.exports = {
	loadBrowsers:		loadBrowsers,
	availableBrowsers:	availableBrowsers,
	killBrowser:		killBrowser,
	killBrowsers:		killBrowsers,
	platformBrowsers:	platformBrowsers
};