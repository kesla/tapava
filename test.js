import tape from 'tape-catch';
import tapava from './lib';
import parser from 'tap-parser';
import concat from 'concat-stream';
import Promise from 'bluebird';

const runTest = (fn, onResult) => {
  const test = tapava.createHarness();
  test(fn);
  testToResult(test, onResult);
};

const testToResult = (test, onResult) =>
  test.createStream().pipe(parser(onResult));

const testToString = (test, onString) =>
  test.createStream().pipe(concat({encoding: 'string'}, onString));

tape('title', t => {
  const test = tapava.createHarness();
  test('the message', tt => {});
  testToString(test, string => {
    t.is(string.split('\n')[1], '# the message');
    t.end();
  });
});

tape('throwing is failing', t => {
  runTest(
    tt => {
      throw new Error('Foo bar');
    },
    result => {
      t.notOk(result.ok);
      t.is(result.fail, 1);
      t.is(result.count, 1);
      t.is(result.failures[0].name, 'Error: Foo bar');
      t.end();
    }
  );
});

tape('simple .pass()', t => {
  const test = tapava.createHarness();

  test(tt => {
    tt.pass('pass');
  });

  const p = parser(result => {
    t.ok(result.ok);
    t.is(result.pass, 1);
    t.is(result.count, 1);
    t.end();
  });

  const s = test.createStream();
  s.pipe(p);
  setImmediate(() => {
    s.end();
  });
});

tape('promises', t => {
  let isAsync = false;
  runTest(
    tt => {
      return new Promise(resolve => {
        tt.pass('blip blop');
        setImmediate(() => {
          isAsync = true;
          resolve();
        });
      });
    },
    result => {
      t.ok(isAsync);
      t.equal(result.count, 1);
      t.equal(result.pass, 1);
      t.end();
    }
  );
});

tape('promises, errors', t => {
  runTest(
    tt => {
      return new Promise(resolve => {
        throw new Error('Heya');
      });
    },
    result => {
      t.notOk(result.ok);
      t.equal(result.count, 1);
      t.equal(result.fail, 1);
      t.end();
    }
  );
});

tape('generator', t => {
  runTest(
    function * (tt) {
      tt.pass('first');
      yield new Promise(resolve => {
        setImmediate(() => {
          tt.pass('bling bling');
          resolve();
        });
      });
    },
    result => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
      t.end();
    }
  );
});

tape('only', t => {
  const test = tapava.createHarness();
  test('test1', tt => {});
  test.only('test2', tt => {});
  testToString(test, string => {
    t.is(string.split('\n')[1], '# test2');
    t.end();
  });
});

tape('skip', t => {
  const test = tapava.createHarness();
  test.skip('this should not be run', tt => {
    t.fail('wtf');
  });
  testToResult(test, result => {
    t.ok(result.ok);
    t.equal(result.count, 0);
    t.end();
  });
});

tape('t.plan()', t => {
  runTest(
    tt => {
      tt.plan(2);
      tt.pass('passing!');
      tt.pass('passing2');
    },
    result => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
      t.end();
    }
  );
});

tape('t.pass() / t.fail()', t => {
  runTest(
    tt => {
      tt.pass('passing!');
      tt.fail('noes');
    },
    result => {
      t.notOk(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 1);
      t.equal(result.fail, 1);
      t.end();
    }
  );
});

tape('t.truthy() / t.falsy()', t => {
  t.plan(6);

  runTest(
    tt => {
      tt.truthy(1);
      tt.falsy(0);
    },
    result => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
    }
  );

  runTest(
    tt => {
      tt.truthy(0);
      tt.falsy(1);
    },
    result => {
      t.notOk(result.ok);
      t.equal(result.count, 2);
      t.equal(result.fail, 2);
    }
  );
});

tape('t.true() / t.false()', t => {
  t.plan(6);

  runTest(
    tt => {
      tt.true(true);
      tt.false(false);
    },
    result => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
    }
  );

  runTest(
    tt => {
      tt.true(1);
      tt.false(0);
    },
    result => {
      t.notOk(result.ok);
      t.equal(result.count, 2);
      t.equal(result.fail, 2);
    }
  );
});

tape('t.is() / t.not()', t => {
  t.plan(6);

  runTest(
    tt => {
      tt.is(1, 1);
      tt.not(1, '1');
    },
    result => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
    }
  );

  runTest(
    tt => {
      tt.is(1, '1');
      tt.not(1, 1);
    },
    result => {
      t.notOk(result.ok);
      t.equal(result.count, 2);
      t.equal(result.fail, 2);
    }
  );
});

tape('t.deepEqual() / t.notDeepEqual()', t => {
  t.plan(6);

  runTest(
    tt => {
      tt.deepEqual({foo: true}, {foo: true});
      tt.notDeepEqual({foo: true}, {foo: false});
    },
    result => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
    }
  );

  runTest(
    tt => {
      tt.deepEqual({foo: true}, {foo: false});
      tt.notDeepEqual({foo: true}, {foo: true});
    },
    result => {
      t.notOk(result.ok);
      t.equal(result.count, 2);
      t.equal(result.fail, 2);
    }
  );
});

tape('t.match() / t.notMatch()', t => {
  t.plan(6);

  runTest(
    tt => {
      tt.match({foo: true, beep: 'boop'}, {foo: true});
      tt.notMatch({foo: true, beep: 'boop'}, {foo: false});
    },
    result => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
    }
  );

  runTest(
    tt => {
      tt.match({foo: true, beep: 'boop'}, {foo: false});
      tt.notMatch({foo: true, beep: 'boop'}, {foo: true});
    },
    result => {
      t.notOk(result.ok);
      t.equal(result.count, 2);
      t.equal(result.fail, 2);
    }
  );
});

tape('t.throws / t.notThrows with functions', t => {
  t.plan(6);

  runTest(
    tt => {
      tt.throws(() => { throw new Error('beep boop'); });
      tt.notThrows(() => {});
    },
    result => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
    }
  );

  runTest(
    tt => {
      tt.throws(() => {});
      tt.notThrows(() => { throw new Error('beep boop'); });
    },
    result => {
      t.notOk(result.ok);
      t.equal(result.count, 2);
      t.equal(result.fail, 2);
    }
  );
});

tape('t.throws / t.notThrows with promises', t => {
  t.plan(6);

  runTest(
    function * (tt) {
      tt.plan(2);
      yield tt.throws(Promise.reject(new Error('beep boop')));
      yield tt.notThrows(Promise.resolve());
    },
    result => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
    }
  );

  runTest(
    function * (tt) {
      tt.plan(2);
      yield tt.throws(Promise.resolve());
      yield tt.notThrows(Promise.reject(new Error('beep boop')));
    },
    result => {
      t.notOk(result.ok);
      t.equal(result.count, 2);
      t.equal(result.fail, 2);
    }
  );
});

tape('t.end() is not allowed', t => {
  runTest(
    tt => {
      tt.end();
    },
    result => {
      t.notOk(result.ok);
      t.equal(result.count, 1);
      t.equal(result.fail, 1);
      t.end();
    }
  );
});

tape('callback mode', t => {
  const test = tapava.cb.createHarness();

  test(function (tt) {
    // tt.ok should not be defined since that's a tape method
    // and not a tapava method
    tt.pass('yes!');
    t.notOk(tt.ok);
    tt.end();
  });

  testToResult(test, result => {
    t.ok(result.ok);
    t.equal(result.count, 1);
    t.equal(result.pass, 1);
    t.end();
  });
});

if (process.browser) {
  tape.onFinish(window.close);
}
