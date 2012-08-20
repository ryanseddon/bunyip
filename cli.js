#!/usr/bin/env node
var program = require('./lib/options');
require("./lib/bunyip").route(program);