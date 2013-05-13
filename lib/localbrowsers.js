var fs = require("fs"),
    os = require("os"),
    exec = require('child_process').exec;

function LocalBrowsers(config, port) {
    
    var url = "http://localhost:" + port,
        tmpdir = process.env.TMPDIR || process.env.TMP,
        urltxt = tmpdir + "bunyipurl.txt",
        phantom = tmpdir + "bunyipphantom.js",
        // OSX open as new instance, do not bring to foreground and specify application name
        cmdPrefix = "open -n -g -a",
        cmdPrefixLinux = "exec",
        activeBrowsers = {},
        programFiles = os.arch() === "x64" ? process.env["ProgramFiles(x86)"] : process.env.ProgramFiles,
        browsers = {
            firefox: {
                name: "Firefox",
                win32: '"' + programFiles + '\\Mozilla Firefox\\firefox.exe' + '"',
                darwin: cmdPrefix + ' Firefox --args',
                linux: cmdPrefixLinux + ' firefox '
            },
            firefoxaurora: {
                name: "Firefox Aurora",
                win32: '"' + programFiles + '\\Aurora\\firefox.exe' + '"',
                darwin: cmdPrefix + ' FirefoxAurora --args'
            },
            firefoxnightly: {
                name: "Firefox Nightly",
                win32: '"' + programFiles + '\\Firefox Nightly\\firefox.exe' + '"',
                darwin: cmdPrefix + ' Nightly --args'
            },
            chrome: {
                name: "Google Chrome",
                win32: '"' + process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe' + '"',
                darwin: cmdPrefix + ' "Google Chrome" --args',
                linux: cmdPrefixLinux + ' google-chrome '
            },
            chromecanary: {
                name: "Google Chrome Canary",
                win32: '"' + process.env.LOCALAPPDATA + '\\Google\\Chrome SxS\\Application\\chrome.exe' + '"',
                darwin: cmdPrefix + ' "Google Chrome Canary" --args'
            },
            opera: {
                name: "Opera",
                win32: '"' + programFiles + '\\Opera\\opera.exe' + '"',
                darwin: cmdPrefix + ' Opera --args',
                linux: cmdPrefixLinux+ ' opera '
            },
            operanext: {
                name: "Opera Next",
                win32: '"' + programFiles + '\\Opera Next x64\\opera.exe' + '"',
                darwin: cmdPrefix + ' "Opera Next" --args'
            },
            safari: {
                name: "Safari",
                win32: '"' + programFiles + '\\Safari\\safari.exe' + '"',
                darwin: cmdPrefix + ' Safari'
            },
            ie: {
                win32: '"' + programFiles + '\\Internet Explorer\\iexplore.exe' + '"'
            },
            phantomjs: {
                name: "phantomjs",
                win32: 'phantomjs',
                darwin: 'phantomjs',
                linux: cmdPrefixLinux+' phantomjs'
            }
        };

    var launchBrowsers = function(launch) {
        if(launch === undefined) {
            for(var browser in browsers) {
                if(browser) {
                    cleanLaunch(browser, browsers);
                }
            }
        } else {
            var arr = launch.split("|");
            
            activeBrowsers.isActive = true;

            for(var i = 0; i < arr.length; i++) {
                activeBrowsers[arr[i]] = browsers[arr[i]];
                if(activeBrowsers[arr[i]]) {
                    cleanLaunch(arr[i], activeBrowsers);
                } else {
                    console.log("Can't find any browser with the following name: %s", arr[i]);
                    process.kill();
                }
            }
        }
    };

    // In order to get browsers to launch without error we need to pass specific flags to some of them
    var cleanLaunch = function(browser, data) {
        // Some browsers are platform specific so exit out if not available
        if(data[browser][process.platform]) {
            if(browser.indexOf("firefox") !== -1) {
                // Handles firefox, firefox aurora and firefox nightly
                cleanLaunchFirefox(browser, data);
            } else if(browser.indexOf("chrome") !== -1) {
                // Handles chrome and chrome canary
                cleanLaunchChrome(browser, data);
            } else if(browser.indexOf("opera") !== -1) {
                // Handles opera and opera next
                cleanLaunchOpera(browser, data);
            } else if(browser.indexOf("phantomjs") !== -1) {
                // Handles opera and opera next
                cleanLaunchPhantomjs(browser, data);
            }  else {
                // Safari don't require special treatment
                data[browser].process = exec(data[browser][process.platform] + " " + url);
            }
        }
    };

    // Force no first run, turn of default browser check and use custom data directory
    var cleanLaunchChrome = function(browser, data) {
        data[browser].process = exec(data[browser][process.platform] + " --no-default-browser-check --no-first-run --user-data-dir=" + tmpdir + " " + url);
    };

    // Force no first run, turn of default browser check and use custom data directory
    var cleanLaunchOpera = function(browser, data) {
        // Because of a bug with the -nosession cli flag and it ingoring any other options after it we need to use the
        // urllist flag and write the file on the fly to get the url to load in opera while avoiding session recovery.
        fs.writeFile(urltxt, url, 'utf8', function(err) {
            if(err) {
                return console.log(err);
            }
        });

        data[browser].process = exec(data[browser][process.platform] + " -urllist " + urltxt + " -nosession");
    };

    // Specify it to be a new process and to create/use a custom profile
    var cleanLaunchFirefox = function(browser, data) {
        exec(data[browser][process.platform] + " -CreateProfile bunyip-"+browser,function(){
            data[browser].process = exec(browsers[browser][process.platform] + " -no-remote -silent -p bunyip-"+browser + " " + url);
        });
    };

    var cleanLaunchPhantomjs = function(browser, data) {
        // Phantom needs the first arg to be js file that tells it what to do
        fs.writeFile(phantom, '(new WebPage).open("' + url + '")', 'utf8', function(err) {
            if(err) {
                return console.log(err);
            }
        });

        data[browser].process = exec(data[browser][process.platform] + " " + phantom);
    };

    var exitBrowsers = function() {
        // Delete the url file opera needs, user may not have launched opera so catch it.
        try {
            fs.unlinkSync(urltxt);
        } catch(e){}

        // Delete the file phantomjs needs
        try {
            fs.unlinkSync(phantom);
        } catch(e){}

        if(activeBrowsers.isActive) {
            for(var activeBrowser in activeBrowsers) {
                // Some browsers are platform specific so exit out if not available
                if(activeBrowsers[activeBrowser][process.platform]) {
                    // Windows requires taskill, OSX works best with osacript
                    if(process.platform === "win32") {
                        exec('taskkill /t /f /pid ' + activeBrowsers[activeBrowser].process.pid);
                    } 
                    else if (process.platform === "darwin") {
                        if(activeBrowser !== "phantomjs") {
                            exec("osascript -e 'tell application \"" + activeBrowsers[activeBrowser].name + "\" to quit'");
                        } else {
                            activeBrowsers[activeBrowser].process.kill('SIGHUP');
                        }
                    }
                    else if (process.platform === "linux") {
                        if(activeBrowser !== "phantomjs") {
                        activeBrowsers[activeBrowser].process.kill('SIGHUP');
                        }
                        else { 
                            activeBrowsers[activeBrowser].process.kill('SIGKILL'); 
                        }

                    }
                }
            }
        }
        else {
            for(var browser in browsers) {
                // Some browsers are platform specific so exit out if not available
                if(browsers[browser][process.platform]) {
                    if(process.platform === "win32") {
                        exec('taskkill /t /f /pid ' + browsers[browser].process.pid);
                    } 
                    else if (process.platform === "darwin") {
                        if(browser !== "phantomjs") {
                            exec("osascript -e 'tell application \"" + browsers[browser].name + "\" to quit'");
                        } 
                        else {
                            browsers[browser].process.kill('SIGHUP');
                        }
                    }
                    else if(process.platform === "linux") { 
                        if (browser !== "phantomjs") {
                            browsers[browser].process.kill('SIGHUP');
                        }
                        else { 
                            browsers[browser].process.kill('SIGKILL'); 
                        }
                    }
                }
            }
        }
    };

    this.launchBrowsers  = launchBrowsers;
    this.exitBrowsers    = exitBrowsers;
}

module.exports = LocalBrowsers;
