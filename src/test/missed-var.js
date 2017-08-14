'use strict';

const sec = require('..');

const tpl = {
  scopes: {
    DB: [
      {name: "PASSWORD"}
    ]
  }
};

sec(tpl);
