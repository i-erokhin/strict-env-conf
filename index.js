'use strict';

const TEMPLATE_FILE = 'conftemplate.js';

const path = require('path');
const util = require('util');
const lstat = util.promisify(require('fs').lstat);

const defaultFilters = {
  'number': [Number],
  'boolean': [booleanFilter]
};

/**
 * A template loads once, env can be scanned many times (TODO), without application restart.
 * This opportunity may be used for on-the-fly configuration update.
 */
let template;

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
      const inode = await lstat(filePath);
      if (inode.isFile()) {
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

/**
 * First time init - the function is async, because call to filesystem required
 *
 * @param startDir
 * @param templateFilename
 * @returns {Promise.<*>}
 */
async function load(startDir, templateFilename=TEMPLATE_FILE) {
  const confTplFile = await lifton(templateFilename, startDir);
  template = require(confTplFile);
  return conf(template);
}

/**
 * On-the-fly configuration update - no async needed, just re-reading env
 *
 * todo: template normalization of first load (async), for fast env rescan
 * todo: move this functionality to conf object
 */
function reload() {
  if (template === undefined) {
    throw new Error(`Call to reload() without load() is not possible.`);
  }
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

exports.lifton = lifton;
exports.load = load;
exports.reload = reload;
