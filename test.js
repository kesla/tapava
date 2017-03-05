// @flow
/* eslint-disable import/no-extraneous-dependencies, no-param-reassign */

import tape from 'tape';
import parser from 'tap-parser';
import concat from 'concat-stream';

import tapava from './lib';

const testToResult = (test, onResult) => {
  const stream = test.createStream();
  stream.pipe(parser(onResult));
};

const runTest = (fn, onResult) => {
  const test = tapava.createHarness();
  test('', fn);
  testToResult(test, onResult);
};

const testToString = (test, onString: (string) => void) =>
  test.createStream().pipe(concat({ encoding: 'string' }, onString));

tape('title', (t) => {
  const test = tapava.createHarness();
  test('the message', () => {});
  testToString(test, (string) => {
    t.is(string.split('\n')[1], '# the message');
    t.end();
  });
});

tape('throwing is failing', (t) => {
  runTest(
    () => {
      throw new Error('Foo bar');
    },
    (result) => {
      t.notOk(result.ok);
      t.is(result.fail, 1);
      t.is(result.count, 1);
      t.is(result.failures[0].name, 'Error: Foo bar');
      t.end();
    },
  );
});

tape('simple .pass()', (t) => {
  const test = tapava.createHarness();

  test('', (tt) => {
    tt.pass('pass');
  });

  const p = parser((result) => {
    t.ok(result.ok);
    t.is(result.fail, 0);
    t.is(result.pass, 1);
    t.is(result.count, 1);
    t.end();
  });

  test.createStream().pipe(p);
});


tape('t.pass() / t.fail()', (t) => {
  runTest(
    (tt) => {
      tt.pass('passing!');
      tt.fail('noes');
    },
    (result) => {
      t.notOk(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 1);
      t.equal(result.fail, 1);
      t.end();
    },
  );
});

tape('promises', (t) => {
  let isAsync = false;
  runTest(
    tt => new Promise((resolve) => {
      tt.pass('blip blop');
      setImmediate(() => {
        isAsync = true;
        resolve();
      });
    }),
    (result) => {
      t.ok(isAsync);
      t.equal(result.count, 1);
      t.equal(result.pass, 1);
      t.end();
    },
  );
});

tape('promises, errors', (t) => {
  runTest(
    () => new Promise(() => {
      throw new Error('Heya');
    }),
    (result) => {
      t.notOk(result.ok);
      t.equal(result.count, 1);
      t.equal(result.fail, 1);
      t.end();
    },
  );
});

tape('multiple', (t) => {
  const test = tapava.createHarness();
  test('test1', (tt) => {
    tt.pass('test1');
  });
  test('test2', async (tt) => {
    tt.pass('test2');
  });

  testToString(test, (string) => {
    const rows = string.trim().split('\n');
    t.is(rows[1], '# test1');
    t.is(rows[3], '# test2');
    t.is(rows[rows.length - 3], '# tests 2');
    t.is(rows[rows.length - 2], '# pass 2');
    t.is(rows[rows.length - 1], '# fail 0');
    t.end();
  });
});

tape('only', (t) => {
  const test = tapava.createHarness();
  test('test1', () => {});
  test.only('test2', () => {});
  testToString(test, (string) => {
    t.is(string.split('\n')[1], '# test2');
    t.end();
  });
});

tape('skip', (t) => {
  const test = tapava.createHarness();
  test.skip('this should not be run', () => {
    t.fail('wtf');
  });
  testToResult(test, (result) => {
    t.ok(result.ok);
    t.equal(result.count, 0);
    t.end();
  });
});

tape('t.plan()', (t) => {
  runTest(
    (tt) => {
      tt.plan(2);
      tt.pass('passing!');
      tt.pass('passing2');
    },
    (result) => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
      t.end();
    },
  );
});

tape('t.plan(), failing', (t) => {
  runTest(
    (tt) => {
      tt.plan(3);
      tt.pass('passing!');
      tt.pass('passing2');
    },
    (result) => {
      t.notOk(result.ok);
      t.equal(result.count, 3);
      t.equal(result.pass, 2);
      t.equal(result.fail, 1);
      t.end();
    },
  );
});

tape('t.truthy() / t.falsy() passing', (t) => {
  runTest(
    (tt) => {
      tt.truthy(1);
      tt.falsy(0);
    },
    (result) => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
      t.end();
    },
  );
});

tape('t.truthy() / t.falsy() failing', (t) => {
  runTest(
    (tt) => {
      tt.truthy(0);
      tt.falsy(1);
      tt.truthy(0, 'foo');
      tt.falsy(1, 'bar');
    },
    (result) => {
      t.equal(result.failures[0].diag.operator, 'truthy');
      t.equal(result.failures[0].name, 'should be truthy');
      t.equal(result.failures[1].diag.operator, 'falsy');
      t.equal(result.failures[1].name, 'should be falsy');
      t.equal(result.failures[2].diag.operator, 'truthy');
      t.equal(result.failures[2].name, 'foo');
      t.equal(result.failures[3].diag.operator, 'falsy');
      t.equal(result.failures[3].name, 'bar');
      t.notOk(result.ok);
      t.equal(result.count, 4);
      t.equal(result.fail, 4);
      t.end();
    },
  );
});

tape('t.true() / t.false()', (t) => {
  runTest(
    (tt) => {
      tt.true(true);
      tt.false(false);
    },
    (result) => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
      t.end();
    },
  );
});

tape('t.true() / t.false() failing', (t) => {
  runTest(
    (tt) => {
      tt.true(1);
      tt.false(0);
      tt.true(1, 'foo');
      tt.false(0, 'bar');
    },
    (result) => {
      t.is(result.failures[0].diag.operator, 'true');
      t.is(result.failures[0].name, 'should be true');
      t.is(result.failures[1].diag.operator, 'false');
      t.is(result.failures[1].name, 'should be false');
      t.is(result.failures[2].diag.operator, 'true');
      t.is(result.failures[2].name, 'foo');
      t.is(result.failures[3].diag.operator, 'false');
      t.is(result.failures[3].name, 'bar');
      t.notOk(result.ok);
      t.is(result.count, 4);
      t.is(result.fail, 4);
      t.end();
    },
  );
});

tape('t.is() / t.not()', (t) => {
  runTest(
    (tt) => {
      tt.is(1, 1);
      tt.not(1, '1');
    },
    (result) => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
      t.end();
    },
  );
});

tape('t.is() / t.not() failing', (t) => {
  runTest(
    (tt) => {
      tt.is(1, '1');
      tt.not(1, 1);
      tt.is(1, '1', 'foo');
      tt.not(1, 1, 'bar');
    },
    (result) => {
      t.equal(result.failures[0].diag.operator, 'is');
      t.equal(result.failures[0].name, 'should be strict equal');
      t.equal(result.failures[1].diag.operator, 'not');
      t.equal(result.failures[1].name, 'should not be strict equal');
      t.equal(result.failures[2].diag.operator, 'is');
      t.equal(result.failures[2].name, 'foo');
      t.equal(result.failures[3].diag.operator, 'not');
      t.equal(result.failures[3].name, 'bar');
      t.notOk(result.ok);
      t.equal(result.count, 4);
      t.equal(result.fail, 4);
      t.end();
    },
  );
});

tape('t.deepEqual() / t.notDeepEqual()', (t) => {
  runTest(
    (tt) => {
      tt.deepEqual({ foo: true }, { foo: true });
      tt.notDeepEqual({ foo: true }, { foo: false });
    },
    (result) => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
      t.end();
    },
  );
});

tape('t.deepEqual() / t.notDeepEqual() failing', (t) => {
  runTest(
    (tt) => {
      tt.deepEqual({ foo: true }, { foo: false });
      tt.notDeepEqual({ foo: true }, { foo: true });
      tt.deepEqual({ foo: true }, { foo: false }, 'foo');
      tt.notDeepEqual({ foo: true }, { foo: true }, 'bar');
    },
    (result) => {
      t.equal(result.failures[0].diag.operator, 'deepEqual');
      t.equal(result.failures[0].name, 'should be deep equal');
      t.equal(result.failures[1].diag.operator, 'notDeepEqual');
      t.equal(result.failures[1].name, 'should not be deep equal');
      t.equal(result.failures[2].diag.operator, 'deepEqual');
      t.equal(result.failures[2].name, 'foo');
      t.equal(result.failures[3].diag.operator, 'notDeepEqual');
      t.equal(result.failures[3].name, 'bar');
      t.notOk(result.ok);
      t.equal(result.count, 4);
      t.equal(result.fail, 4);
      t.end();
    },
  );
});

tape('t.match() / t.notMatch()', (t) => {
  t.plan(6);

  runTest(
    (tt) => {
      tt.match({ foo: true, beep: 'boop' }, { foo: true });
      tt.notMatch({ foo: true, beep: 'boop' }, { foo: false });
    },
    (result) => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
    },
  );

  runTest(
    (tt) => {
      tt.match({ foo: true, beep: 'boop' }, { foo: false });
      tt.notMatch({ foo: true, beep: 'boop' }, { foo: true });
    },
    (result) => {
      t.notOk(result.ok);
      t.equal(result.count, 2);
      t.equal(result.fail, 2);
    },
  );
});

tape('t.throws / t.notThrows with functions', (t) => {
  t.plan(6);

  runTest(
    (tt) => {
      tt.throws(() => {
        throw new Error('beep boop');
      });
      tt.notThrows(() => {});
    },
    (result) => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
    },
  );

  runTest(
    (tt) => {
      tt.throws(() => {});
      tt.notThrows(() => {
        throw new Error('beep boop');
      });
    },
    (result) => {
      t.notOk(result.ok);
      t.equal(result.count, 2);
      t.equal(result.fail, 2);
    },
  );
});

tape('t.throws / t.notThrows with promises', (t) => {
  t.plan(6);

  runTest(
    async (tt) => {
      tt.plan(2);
      await tt.throws(Promise.reject(new Error('beep boop')));
      await tt.notThrows(Promise.resolve());
    },
    (result) => {
      t.ok(result.ok);
      t.equal(result.count, 2);
      t.equal(result.pass, 2);
    },
  );

  runTest(
    async (tt) => {
      tt.plan(2);
      await tt.throws(Promise.resolve());
      await tt.notThrows(Promise.reject(new Error('beep boop')));
    },
    (result) => {
      t.notOk(result.ok);
      t.equal(result.count, 2);
      t.equal(result.fail, 2);
    },
  );
});

/*
tape('t.end() is not allowed', (t) => {
  runTest(
    (tt) => {
      tt.end();
    },
    (result) => {
      t.notOk(result.ok);
      t.equal(result.count, 1);
      t.equal(result.fail, 1);
      t.end();
    },
  );
});

tape('callback mode', (t) => {
  const test = tapava.cb.createHarness();

  test((tt) => {
    // tt.ok should not be defined since that's a tape method
    // and not a tapava method
    tt.pass('yes!');
    t.notOk(tt.ok);
    tt.end();
  });

  testToResult(test, (result) => {
    t.ok(result.ok);
    t.equal(result.count, 1);
    t.equal(result.pass, 1);
    t.end();
  });
});

tape('throwing is failing in callback mode', (t) => {
  const test = tapava.cb.createHarness();

  test(() => {
    throw new Error('Foo bar');
  });

  testToResult(test, (result) => {
    t.notOk(result.ok);
    t.is(result.fail, 1);
    t.is(result.count, 1);
    t.is(result.failures[0].name, 'Error: Foo bar');
    t.end();
  });
});

tape('custom assertion', (t) => {
  t.plan(7);

  const createCustom = tt => ({ foo }, message) => tt.custom(foo === 'bar', {
    operator: 'foo', actual: foo, expected: 'bar', message,
  });

  runTest(
    (tt) => {
      tt.foo = createCustom(tt);
      t.ok(tt.custom);

      tt.foo({ foo: 'bar' });
    },
    (result) => {
      t.ok(result.ok);
      t.equal(result.count, 1);
      t.equal(result.pass, 1);
    },
  );

  runTest(
    (tt) => {
      tt.foo = createCustom(tt);

      tt.foo({ foo: 'bas' });
    },
    (result) => {
      t.notOk(result.ok);
      t.equal(result.count, 1);
      t.equal(result.fail, 1);
    },
  );
});

if (process.browser) {
  tape.onFinish(global.close);
}
*/
