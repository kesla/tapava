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
  plan: t.plan.bind(t),
  pass: t.pass.bind(t),
  fail: t.fail.bind(t),
  is: t.strictEqual.bind(t),
  not: t.notStrictEqual.bind(t),
  deepEqual: t.deepEqual.bind(t),
  notDeepEqual: t.notDeepEqual.bind(t),
  truthy: t.ok.bind(t),
  falsy: t.notOk.bind(t),
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
  match: (actual, expected, message = 'should match') => {
    t._assert(tmatch(actual, expected), {
      operator: 'match',
      message, actual, expected
    });
  },
  notMatch: (actual, notExpected, message = 'should not match') => {
    t._assert(!tmatch(actual, notExpected), {
      operator: 'notMatch',
      message, actual, notExpected
    });
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
