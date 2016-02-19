import test from 'tape';

const wrapCb = (cb) => {
  return t => {
    const res = cb(t);

    if (res.then) {
      res.then(() => t.end(), err => t.end(err));
    } else {
      t.end();
    }
  };
};

module.exports = (msg, cb) => {
  if (typeof msg === 'function') {
    test(wrapCb(msg));
  } else {
    test(msg, wrapCb(cb));
  }
};
module.exports.cb = test;
