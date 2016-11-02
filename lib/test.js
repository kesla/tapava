import tmatch from 'tmatch';
import deepEqual from 'deep-equal';
import isPromise from 'is-promise';
import throwsPromise from './throws-promise';

export default (t, callbackMode) => ({
  plan: t.plan.bind(t),
  pass: t.pass.bind(t),
  fail: t.fail.bind(t),
  is: (actual, expected, message = 'should be strict equal') =>
    t._assert(expected === actual, {
      operator: 'is', actual, expected, message
    }),
  not: (actual, notExpected, message = 'should not be strict equal') =>
    t._assert(notExpected !== actual, {
      operator: 'not', actual, notExpected, message
    }),
  deepEqual: (actual, expected, message = 'should be deep equal') =>
    t._assert(deepEqual(actual, expected), {
      operator: 'deepEqual', actual, expected, message
    }),
  notDeepEqual: (actual, notExpected, message = 'should not be deep equal') =>
    t._assert(!deepEqual(actual, notExpected), {
      operator: 'notDeepEqual', actual, notExpected, message
    }),
  truthy: (actual, message = 'should be truthy') =>
    t._assert(actual, {
      operator: 'truthy', message, actual, expected: true
    }),
  falsy: (actual, message = 'should be falsy') => {
    t._assert(!actual, {
      operator: 'falsy', message, actual, expected: false
    });
  },
  true: (actual, message = 'should be true ') => {
    t._assert(actual === true, {
      operator: 'true', message, actual, expected: true
    });
  },
  false: (actual, message = 'should be false') => {
    t._assert(actual === false, {
      operator: 'false', message, actual, expected: false
    });
  },
  throws: (value, expected, message) =>
    (isPromise(value) ?
    throwsPromise(t.throws.bind(t), value, expected, message) :
    t.throws(value, expected, message)),
  notThrows: (value, notExpected, message) =>
    (isPromise(value) ?
    throwsPromise(t.doesNotThrow.bind(t), value, notExpected, message) :
    t.doesNotThrow(value, notExpected, message)),
  match: (actual, expected, message = 'should match') =>
    t._assert(tmatch(actual, expected), {
      operator: 'match', message, actual, expected
    }),
  notMatch: (actual, notExpected, message = 'should not match') =>
    t._assert(!tmatch(actual, notExpected), {
      operator: 'notMatch', message, actual, notExpected
    }),
  end: callbackMode ? t.end.bind(t) : () => {
    throw new Error('t.end() is only allowed in callback mode');
  }
});
