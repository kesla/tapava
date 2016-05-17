import tape from 'tape-catch';
import {fn as isGenerator} from 'is-generator';
import co from 'co';
import 'babel-polyfill';
import isPromise from 'is-promise';
import nodeify from 'nodeify';

const wrapCb = (cb) => {
  return t => {
    const res = isGenerator(cb) ? co.wrap(cb)(t) : cb(t);

    if (isPromise(res)) {
      nodeify(res, t.end);
    } else {
      t.end();
    }
  };
};

const createFn = test => (msg, cb) => typeof msg === 'function'
  ? test(wrapCb(msg)) : test(msg, wrapCb(cb));

const wrap = test => {
  const fn = createFn(test);

  fn.createStream = test.createStream;
  fn.only = createFn(test.only);

  return fn;
};

module.exports = wrap(tape);
module.exports.cb = tape;
module.exports.createHarness = opts => wrap(tape.createHarness(opts));
