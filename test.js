import tape from 'tape-catch';
import tapava from './lib';
import parser from 'tap-parser';
import concat from 'concat-stream';

const runTest = (fn, onResult) => {
  const test = tapava.createHarness();
  test(fn);
  test.createStream().pipe(parser(onResult));
};

tape('msg', t => {
  const test = tapava.createHarness();
  test('the message', tt => {});
  test.createStream().pipe(concat({encoding: 'string'}, string => {
    t.is(string.split('\n')[1], '# the message');
    t.end();
  }));
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

tape('t.end is not needed', t => {
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

if (process.browser) {
  tape.onFinish(window.close);
}
