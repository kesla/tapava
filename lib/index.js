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

type CustomMetaType = {
  message: string,
  operator: string,
  actual?: any,
  expected?: any,
}

class Test {
  constructor({ result }: { result: Result }) {
    this._result = result;
  }

  _result: Result

  custom (assert: boolean, { operator, actual, expected, message }: CustomMetaType) {
    if (assert) {
      this._result.pass(message);
    } else {
      this._result.fail(
        message,
        {
          operator,
          actual: actual && objectInspect(actual),
          expected: expected && objectInspect(expected)
        }
      );
    }
  }

  pass (message) {
    this._result.pass(message);
  }

  fail (message) {
    this._result.fail(message, { operator: 'fail' })
  }

  plan (count) {
    this._result.plan(count);
  }

  truthy(actual: any, message: string = 'should be truthy') {
    this.custom(
      !!actual,
      { operator: 'truthy', message, actual, expected: true }
    );
  }

  falsy(actual: any, message: string = 'should be falsy') {
    this.custom(
      !actual,
      { operator: 'falsy', message, actual, expected: false }
    );
  }

  true(actual: any, message: string = 'should be true') {
    this.custom(
      actual === true,
      { operator: 'true', message, actual, expected: true }
    );
  }

  false(actual: any, message: string = 'should be false') {
    this.custom(
      actual === false,
      { operator: 'false', message, actual, expected: false }
    );
  }

  is(actual: any, expected: any, message: string = 'should be strict equal') {
    this.custom(
      actual === expected,
      { operator: 'is', message, actual, expected }
    )
  }

  not(actual: any, expected: any, message: string = 'should not be strict equal') {
    this.custom(
      actual !== expected,
      { operator: 'not', message, actual, expected }
    )
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

    this.planCount = -1;

    this.runTests();
  }

  async runTests () {
    if (this.queue.length === 0) {
      this.finish();
      return;
    }

    const { name, cb } = this.queue.shift();
    this.line(`# ${name}`);

    try {
      await cbToPromise(cb, new Test({ result: this }));
    } catch (err) {
      this.fail(String(err), {
        operator: 'throws',
        actual: objectInspect(err),
      });
    }

    this.runTests();
  }

  finish() {
    const { pass, fail } = this.counts;

    const total = pass + fail;

    if (this.planCount !== -1 && total !== this.planCount) {
      this.fail('plan != count', {
        operator: 'fail',
        expected: String(this.planCount),
        actual: String(total)
      });
    }

    this.line('');
    this.line(`1..${total}`)
    this.line(`# tests ${total}`);
    this.line(`# pass ${pass}`);
    this.line(`# fail ${fail}`);

    this.end();
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

  plan(planCount) {
    this.planCount = planCount;
  }

  planCount: number
  counts: {
    pass: number,
    fail: number
  }
  queue: Array<{ name: string, cb: CallbackType }>
};

class Harness {
  constructor () {
    this.queue = [];
    this.only = [];
  }
  errorCount: number
  queue: Array<{ name: string, cb: CallbackType }>
  only: Array<{ name: string, cb: CallbackType }>

  addTest (name: string, cb: CallbackType): void {
    this.queue.push({ name, cb });
  }

  addOnlyTest (name: string, cb: CallbackType): void {
    this.only.push({ name, cb});
  }

  createStream (): Readable {
    const queue = this.only.length > 0 ? this.only : this.queue;
    return new Result({ queue });
  }
}

const createHarness = () => {
  const harness = new Harness();

  const result = (name: string, cb: CallbackType) => harness.addTest(name, cb);
  result.createStream = () => harness.createStream();
  result.skip = (name: string, cb: CallbackType) => {};
  result.only = (name: string, cb: CallbackType) => harness.addOnlyTest(name, cb);
  return result;
};

const tapava = {
  createHarness
};

module.exports = tapava; // eslint-disable-line import/no-commonjs
