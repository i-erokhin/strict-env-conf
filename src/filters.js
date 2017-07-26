'use strict';

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

function csv2array(str) {
  if (str.trim()) {
    return str.split(',').map(i => i.trim());
  } else {
    return [];
  }
}

function maybeNull(str) {
  if (str === 'null') {
    return null;
  } else {
    return str;
  }
}

module.exports = {
  booleanFilter,
  csv2array,
  maybeNull
};
