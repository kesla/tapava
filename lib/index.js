// @flow

import { PassThrough } from 'stream';
import type { Readable } from 'stream';
import { safeDump } from 'js-yaml';
import objectInspect from 'object-inspect';

type CallbackType = (Test) => (void | Promise<void>);

type FailMetaType = {
  operator: string,
  actual?: string,
  expected?: string
};

class Test {
  constructor({ result }: { result: Result }) {
    this._result = result;
  }

  _result: Result

  pass (msg) {
    this._result.pass(msg);
  }

  fail (msg) {
    this._result.fail(msg, { operator: 'fail' })
  }
}

const cbToPromise = async (cb: CallbackType, t: Test): Promise<void> => {
  const res = cb(t);

  if (res instanceof Promise) {
    await res;
  }
};

class Result extends PassThrough {
  constructor({ queue }) {
    super({ encoding: 'utf8' });
    this.queue = queue;
    this.counts = {
      pass: 0,
      fail: 0
    };

    this.line('TAP version 13');

    const { name, cb } = this.queue[0];
    this.line(`# ${name}`);

    (async () => {
      try {
        await cbToPromise(cb, new Test({ result: this }));
      } catch (err) {
        this.fail(String(err), {
          operator: 'throws',
          actual: objectInspect(err),
        });
      }

      const { pass, fail } = this.counts;

      const total = pass + fail;

      this.line('');
      this.line(`1..${total}`)
      this.line(`# tests ${total}`);
      this.line(`# pass ${pass}`);
      this.line(`# fail ${fail}`);

      this.end();
    })();
  }

  line(str: string) {
    this.write(`${str}\n`);
  }

  indented(indent: number, str:string) {
    const left = ' '.repeat(indent);
    const fixedStr = str.split('\n').map(row => `${left}${row}`).join('\n');
    this.line(`${fixedStr}`);
  }

  pass(name: string) {
    this.counts.pass += 1;
    this.line(`ok ${ this.counts.pass + this.counts.fail } ${name}`);
  }

  fail(name: string, meta: FailMetaType) {
    this.counts.fail += 1;
    this.line(`not ok ${ this.counts.pass + this.counts.fail } ${name}`)
    this.indented(2, '---');
    this.indented(4, safeDump(meta).trim());
    this.indented(2, '...');
  }

  counts: {
    pass: number,
    fail: number
  }
  queue: Array<{ name: string, cb: CallbackType }>
};

class Harness {
  constructor () {
    this.queue = [];
  }
  errorCount: number
  queue: Array<{ name: string, cb: CallbackType }>

  addTest (name: string, cb: CallbackType): void {
    this.queue.push({ name, cb });
  }

  createStream (): Readable {
    return new Result({ queue: this.queue });
  }
}

const createHarness = () => {
  const harness = new Harness();

  const result = (name: string, cb: CallbackType) => harness.addTest(name, cb);
  result.createStream = () => harness.createStream();
  return result;
};
createHarness._queue = [];

const tapava = {
  createHarness
};

module.exports = tapava; // eslint-disable-line import/no-commonjs
