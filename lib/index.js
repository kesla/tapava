import test from 'tape-catch';
import {fn as isGenerator} from 'is-generator';
import isPromise from 'is-promise';
import co from 'co';
import 'babel-polyfill';

const wrapCb = (cb) => {
  return t => {
    const res = isGenerator(cb) ? co.wrap(cb)(t) : cb(t);

    if (isPromise(res)) {
      res.then(() => t.end(), err => t.end(err));
    } else {
      t.end();
    }
  };
};

const wrap = harness => {
  const fn = (msg, cb) => typeof msg === 'function'
    ? harness(wrapCb(msg)) : harness(msg, wrapCb(cb));
  fn.createStream = harness.createStream;
  return fn;
};

module.exports = wrap(test);
module.exports.cb = test;
module.exports.createHarness = opts => wrap(test.createHarness(opts));
