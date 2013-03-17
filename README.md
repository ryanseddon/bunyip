# bunyip

Automate client-side unit testing in real browsers using the CLI

## Getting Started
Install the module with: `npm install -g bunyip`. This is a CLI tool so it needs to be globally installed.

### BrowserStack account
In order for bunyip to flex its real muscle I recommend you get a paid [BrowserStack account](http://www.browserstack.com/pricing) as all paid accounts have access to their API. Without the API you'll need to connect your own slave browsers to bunyip.

### localhost sharing service
If you wish to test on devices that are not part of your local network you'll be required to setup a tunneling service. I recommend [pagekite](https://pagekite.net/support/quickstart/) as it gives you a nice free chunk of data and allows you to specify a reusable subdomain. [Showoff.io](https://showoff.io/) is another good option.

### Setup the config.js file
If you don't wish to use BrowserStack or a localhost sharing service you can skip this step.

To generate a config file you can run this command:

`bunyip config path/to/config.js`

This will take you through a multistep process to setup your username, password, tunnel url and tunnel command.

So I if wanted to save a config file to my home directory I would do the following.

`bunyip config ~/config.js`

### Specify config file to use

If I want to specify a specific config file to use the `-c, --cdir` flag lets you do that.

`bunyip -f test/tests.html -c path/to/config.js`

If you do not specify a config file to use it will look in your current working directory for a file name `config.js` otherwise it will not require one in.

## Test suite adaptors

Behind the scenes bunyip uses a tool called Yeti. Yeti 0.2.14+ works with [YUI Test](http://yuilibrary.com/yuitest/), [QUnit](http://qunitjs.com/), [Mocha](http://visionmedia.github.com/mocha/), [Jasmine](http://pivotal.github.com/jasmine/) or [DOH](http://dojotoolkit.org/reference-guide/util/doh.html). If you use another client-side test suite, you'll have to write an adaptor - please feel free to contribute it to my [yeti-adaptors](https://github.com/ryanseddon/yeti-adaptors) repo, or file an issue/PR with [Yeti](https://github.com/yui/yeti) itself.

## Examples

```bash
bunyip -f index.html
```

The above command will launch a simple Yeti hub on port 9000 and use the `index.html` inside your current working directory.

```bash
bunyip -f index.html -p 1337
```

This will change the port that is used. The global config value will be updated for you so don't worry.

### Locally installed browsers

Using the `local` command you can now open your test suite in all locally installed browsers or specify a series of browsers

```bash
bunyip -f index.html local
```

This will open in all locally installed browsers with one assumption that phantomjs is installed in `/usr/bin/`.

```bash
bunyip -f index.html local -l "firefox|chrome|safari|phantomjs"
```

This will open the installed versions of Firefox, Chrome, Safari and Phantomjs.

The `local` command looks for the following browsers:

* Firefox, Firefox Nightly
* Chrome, Chrome Canary
* Opera, Opera Next
* Safari
* Phantomjs

### BrowserStack workers

```bash
bunyip -f index.html -b ios
```

Assuming you have a BrowserStack paid account and have setup a localhost sharing service the `-b ios` will send off a command to launch all iOS devices (3 iPhones and 3 iPads) on BrowserStack and once they're connected you can run your test suite.

```bash
bunyip -s
```

This will query the BrowserStack API for any device or browsers that are currently running on your account.

```bash
bunyip -k <id> or all
```

If you no longer need a specific worker or you wish to destroy all of them you can either specify a single worker id or `all` and it will destroy said worker(s).

```bash
bunyip -h
```

For more info specify the help flag to get more info about each command flag available.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](https://github.com/cowboy/grunt).

## Release History
* 25/10/2012 - v0.2.2 - Fixes incompatibility with latest yeti release.
* 20/08/2012 - v0.2.0 - Added a `local` command to run your test suite in locally installed browsers.
* 15/07/2012 - v0.1.3 - Added ability to generate config file and to specify location of config file to use.

## License
Copyright (c) 2012 Ryan Seddon
Licensed under the MIT license.
