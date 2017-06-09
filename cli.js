#!/usr/bin/env node
'use strict';

require('dotenv').config();
const sec = require('./index');

(async function main() {
  try {
    const conf = await sec.load(process.cwd());
    console.log(JSON.stringify(conf, null, '  '));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
