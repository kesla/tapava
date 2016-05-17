import tape from 'tape-catch';
import {fn as isGenerator} from 'is-generator';
import co from 'co';
import 'babel-polyfill';
import isPromise from 'is-promise';
import nodeify from 'nodeify';

const wrap = cb => t => {
  const res = isGenerator(cb) ? co.wrap(cb)(t) : cb(t);

  if (isPromise(res)) {
    nodeify(res, t.end);
  } else {
    t.end();
  }
};

const createFn = test => (title, cb) =>
  typeof title === 'function' ? test(wrap(title)) : test(title, wrap(cb));

const setup = test => {
  const fn = createFn(test);

  fn.createStream = test.createStream;
  fn.only = createFn(test.only);

  return fn;
};

module.exports = setup(tape);
module.exports.cb = tape;
module.exports.createHarness = opts => setup(tape.createHarness(opts));
