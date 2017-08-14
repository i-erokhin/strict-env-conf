strict-env-conf
===============

[![NPM version][npm-image]][npm-url]

NPM package for easy work with ENV-based configuration

Usage
-----

Just two examles...

The first idea: if something wrong with your environment variables - your application must crashes 
on startup, not in arbitrary time when running.

```javascript
const sec = require('strict-env-conf');

const tpl = {
  scopes: {
    DB: [
      {name: "PASSWORD"}
    ]
  }
};

sec(tpl);
```

Output:

```
...
Error: Required env variable DB_PASSWORD is not set
...
```

The second idea - parsing string values from environment variables to convenient JS-object with several
types of properties.  

```javascript
const filters = require('strict-env-conf');
const sec = require('strict-env-conf/src/filters');

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
  prefix: 'SEC_', // env variables app-level prefix for safety
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
      {name: "CATEGORIES", default: "2,1,E", filters: [filters.csv2array]},
    ],
  }
};

const testConf = sec(template);
console.log(JSON.stringify(testConf, null, '    '));
```

Output:

```json
{
    "app": {
        "host": "example.com",
        "port": 80
    },
    "db": {
        "external_auth": true,
        "port": 444,
        "name": "my-app"
    },
    "ldap": {
        "test_user_email": null,
        "test_user_id": 4321
    },
    "data": {
        "categories": [
            "2",
            "1",
            "E"
        ]
    }
}
``` 

Installation
------------

```bash
npm i git+https://github.com/i-erokhin/strict-env-conf.git
```

License
-------

MIT

[npm-image]: https://img.shields.io/npm/v/strict-env-conf.svg
[npm-url]: https://www.npmjs.com/package/strict-env-conf
