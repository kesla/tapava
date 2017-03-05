// @flow

import { PassThrough } from 'stream';
import inspect from 'object-inspect';
import { safeDump } from 'js-yaml';

import Test from './test';
import type { CallbackType, FailMetaType, QueueType } from './';

const cbToPromise = async (cb: CallbackType, t: Test): Promise<void> => {
  const res = cb(t);

  if (res instanceof Promise) {
    await res;
  }
};

export default class Result extends PassThrough {
  constructor({ queue }: { queue: QueueType }) {
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
        actual: inspect(err),
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

  plan(planCount: number) {
    this.planCount = planCount;
  }

  planCount: number
  counts: {
    pass: number,
    fail: number
  }
  queue: QueueType
};
