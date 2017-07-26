'use strict';

const filters = require('../filters');
const sec = require('..');

const envVars = {
  SEC_APP_HOST:                   'example.com',
  SEC_APP_PORT:                   '80',
  SEC_DB_EXTERNAL_AUTH:           'true',
  SEC_DB_PORT:                    '444',
  SEC_LDAP_TEST_USER_EMAIL:       'null',
  SEC_LDAP_TEST_USER_ID:          '4321',
};

for (let varName in envVars) {
  process.env[varName] = envVars[varName];
}

const template = {
  prefix: 'SEC_',
  // filters: [str => String(str).trim()] <-- this is by default. Set "filters: []" to avoid this behavior.
  scopes: {
    APP: [
      {name: "HOST", default: "localhost"},
      {name: "PORT", default: 3000} // <-- "filters: [Number]" is redundant here, Number is default filter if (typeof default === 'number')
    ],
    DB: [
      {name: "EXTERNAL_AUTH", default: false}, // <-- default filter for boolean types works with "0", "1", "true", "false"
      {name: "PORT", filters: [Number]},
      {name: "NAME", default: "my-app"}
    ],
    LDAP: [
      {name: "TEST_USER_LOGIN", default: undefined},
      {name: "TEST_USER_EMAIL", default: undefined, filters: [filters.maybeNull]},
      {name: "TEST_USER_ID", default: undefined, filters: [Number]},
    ],
    DATA: [
      {name: "CATEGORIES", default: "4,3,2,1,B", filters: [filters.csv2array]},
    ],
  }
};

const testConf = sec(template);

if (!module.parent) {
  console.log(JSON.stringify(testConf, null, '    '));
} else {
  module.exports = testConf;
}

