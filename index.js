'use strict';

const TEMPLATE_FILE = 'conftemplate.js';

const path = require('path');
const util = require('util');
const lstat = util.promisify(require('fs').lstat);

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

async function lifton(targetFilename, startDir) {
  let nextDir = startDir;
  while (path.parse(nextDir).root !== nextDir) {
    let filePath = path.resolve(nextDir, targetFilename);
    try {
      if ((await lstat(filePath)).isFile()) {
        return filePath;
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
    nextDir = path.resolve(nextDir, '..');
  }
  throw new Error(`File ${TEMPLATE_FILE} not found in ${startDir} and above.`);
}

async function load(startDir, templateFilename=TEMPLATE_FILE) {
  const confTplFile = await lifton(templateFilename, startDir);
  const template = require(confTplFile);
  return conf(template);
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
    c[scope] = {};
    for (let el of t.scopes[scope]) {
      el.required = !el.hasOwnProperty('default');
      el.envVarName = `${t.prefix}${scope}_${el.name}`;
      if (!el.hasOwnProperty('type') && !el.required) {
        el.type = typeof el.type;
      } else {
        el.type = 'string';
      }
      if (defaultFilters[el.type] && !el.filters) {
        el.filters = defaultFilters[el.type];
      } else {
        el.filters = [];
      }

      if (process.env.hasOwnProperty(el.envVarName)) {
        c[scope][el.name] = filter(process.env[el.envVarName], t.filters, el.filters);
      } else {
        if (el.required) {
          throw new Error(`Required env variable ${el.envVarName} is not set`);
        } else {
          c[scope][el.name] = filter(el.default, t.filters, el.filters);
        }
      }
    }
  }
  return c;
}

exports.lifton = lifton;
exports.load = load;