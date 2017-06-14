'use strict';

const path = require('path');
const util = require('util');

const defaultFilters = {
  'number': [Number],
  'boolean': [booleanFilter]
};

function booleanFilter(str) {
  const s = str.trim();
  if (s === '0' || s === 'false') {
    return false;
  } else if (s === '1' || s === 'true') {
    return true;
  } else {
    throw new Error(`Bad value for boolean type: ${str}`);
  }
}

function filter(val, globalFilters, localFilters) {
  for (let gf of globalFilters) {
    val = gf(val);
  }
  for (let lf of localFilters) {
    val = lf(val);
  }
  return val;
}

function conf(t) {
  if (!t.prefix) {
    t.prefix = ''
  }
  if (!t.filters) {
    t.filters = [s => String(s).trim()];
  }
  if (!t.scopes) {
    throw new Error('Key "scopes" is not present in the template.')
  }
  const c = {};

  for (let scope of Object.keys(t.scopes)) {
    const scopeKey = scope.toLowerCase();
    c[scopeKey] = {};
    for (let el of t.scopes[scope]) {
      el.required = !el.hasOwnProperty('default');
      el.envVarName = `${t.prefix}${scope}_${el.name}`;
      if (el.hasOwnProperty('type')) { // && !el.required) {
        el.type = typeof el.type;
      } else if (!el.required) {
        el.type = typeof el.default;
      } else {
        el.type = 'string';
      }

      if (!el.filters) {
        if (defaultFilters[el.type]) {
          el.filters = defaultFilters[el.type];
        } else {
          el.filters = [];
        }
      }

      if (process.env.hasOwnProperty(el.envVarName)) {
        c[scopeKey][el.name.toLowerCase()] = filter(process.env[el.envVarName], t.filters, el.filters);
      } else {
        if (el.required) {
          throw new Error(`Required env variable ${el.envVarName} is not set`);
        } else {
          c[scopeKey][el.name.toLowerCase()] = filter(el.default, t.filters, el.filters);
        }
      }
    }
  }
  return c;
}

module.exports = conf;
