#!/usr/bin/env node
'use strict';

const sec = require('./index');
require('dotenv').config();

async function main() {
  try {
    const conf = await sec.load(process.cwd());
    console.log(conf);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
