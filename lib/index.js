import tape from 'tape-catch';
import {fn as isGenerator} from 'is-generator';
import co from 'co';
import 'babel-polyfill';
import isPromise from 'is-promise';
import nodeify from 'nodeify';
import tmatch from 'tmatch';

const promiseThrows = (fn, promise, expected, message) => {
  return new Promise(resolve => {
    nodeify(promise, err => {
      fn(() => {
        if (err) {
          throw err;
        }
      });
      resolve();
    });
  });
};

const wrapT = (t, callbackMode) => ({
  plan: t.plan,
  pass: t.pass,
  fail: t.fail,
  is: t.strictEqual,
  not: t.notStrictEqual,
  deepEqual: t.deepEqual,
  notDeepEqual: t.notDeepEqual,
  truthy: t.ok,
  falsy: t.notOk,
  true: (value, message) => {
    t.strictEqual(value, true, message);
  },
  false: (value, message) => {
    t.strictEqual(value, false, message);
  },
  throws: (value, expected, message) =>
    isPromise(value)
    ? promiseThrows(t.throws, value, expected, message)
    : t.throws(value, expected, message),
  notThrows: (value, notExpected, message) =>
    isPromise(value)
    ? promiseThrows(t.doesNotThrow, value, notExpected, message)
    : t.doesNotThrow(value, notExpected, message),
  match: (value, expected, message) => {
    t.ok(tmatch(value, expected), message);
  },
  notMatch: (value, notExpected, message) => {
    t.notOk(tmatch(value, notExpected, message));
  },
  end: callbackMode ? t.end : function () {
    throw new Error('t.end() is only allowed in callback mode');
  }
});

const wrap = (cb, callbackMode) => t => {
  const newT = wrapT(t, callbackMode);

  if (callbackMode) {
    cb(newT);
    return;
  }

  const res = isGenerator(cb) ? co.wrap(cb)(newT) : cb(newT);

  if (isPromise(res)) {
    nodeify(res, t.end);
  } else {
    t.end();
  }
};

const setup = (test, {callbackMode} = {}) => {
  const createFn = test => (title, cb) =>
    typeof title === 'function'
    ? test(wrap(title, callbackMode))
    : test(title, wrap(cb, callbackMode));

  const fn = createFn(test);

  fn.createStream = test.createStream;
  fn.only = createFn(test.only);
  fn.skip = () => {};

  return fn;
};

module.exports = setup(tape);
module.exports.createHarness = opts => setup(tape.createHarness(opts));
module.exports.cb = setup(tape, {callbackMode: true});
module.exports.cb.createHarness = opts => setup(tape.createHarness(opts), {callbackMode: true});
