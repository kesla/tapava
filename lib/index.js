import tape from 'tape';
import { fn as isGenerator } from 'is-generator';
import { wrap as co } from 'co';
import 'babel-polyfill';
import isPromise from 'is-promise';
import wrapTest from './test';

const wrap = (cb, callbackMode) => (t) => {
  const newT = wrapTest(t, callbackMode);

  if (callbackMode) {
    try {
      cb(newT);
    } catch (err) {
      t.end(err);
      return;
    }
    return;
  }

  let res;
  try {
    res = isGenerator(cb) ? co(cb)(newT) : cb(newT);
  } catch (err) {
    t.end(err);
    return;
  }

  if (isPromise(res)) {
    res.then(() => t.end(), err => t.end(err));
  } else {
    t.end();
  }
};

const createFn = (test, callbackMode) => (title, cb) =>
  (typeof title === 'function' ?
    test(wrap(title, callbackMode)) :
    test(title, wrap(cb, callbackMode)));


const setup = (test, { callbackMode } = {}) => {
  const fn = createFn(test, callbackMode);

  fn.createStream = test.createStream;
  fn.only = createFn(test.only, callbackMode);
  fn.skip = () => {};

  return fn;
};

module.exports = setup(tape);
module.exports.createHarness = opts => setup(tape.createHarness(opts));
module.exports.cb = setup(tape, { callbackMode: true });
module.exports.cb.createHarness = opts => setup(tape.createHarness(opts), { callbackMode: true });
module.exports.onFinish = tape.onFinish;
