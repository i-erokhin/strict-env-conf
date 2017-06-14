#!/usr/bin/env node
'use strict';

require('dotenv').config();
const sec = require('.');

if (process.argv.length !== 3) {
  console.error(`Usage: strict-env-conf <conf_template_file.js>`);
  process.exit(2);
}

const template = require(process.argv[2]);
const conf = sec(template);
console.log(JSON.stringify(conf, null, '  '));
