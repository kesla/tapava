// @flow

import { PassThrough } from 'stream';
import type { Readable } from 'stream';
import { safeDump } from 'js-yaml';
import objectInspect from 'object-inspect';

type CallbackType = () => void;

class Harness {
  constructor () {
    this.queue = [];
  }
  errorCount: number
  queue: Array<{ name: string, cb: CallbackType }>

  addTest (name: string, cb: () => void): void {
    this.queue.push({ name, cb });
  }

  createStream (): Readable {
    const stream = new PassThrough({ encoding: 'utf8' });
    const write = (str, opts: { indent: number } = { indent: 0 }) => {
      const { indent } = opts;
      const left = ' '.repeat(indent);
      const fixedStr = str.split('\n').map(row => `${left}${row}`).join('\n');
      stream.write(`${fixedStr}\n`);
    };

    write('TAP version 13');

    const { name, cb } = this.queue[0];
    write(`# ${name}`);
    let pass = 0;
    let fail = 0;

    (async () => {
      try {
        await Promise.resolve(cb());
      } catch (err) {
        fail += 1;
        write(`not ok 1 ${String(err)}`);
        write('  ---');
        write(safeDump({
          operator: 'throws',
          actual: objectInspect(err)
        }).trim(), { indent: 4 });
        write('  ...');
      }
    })();

    const tests = pass + fail;

    write('');
    write(`1..${tests}`)
    write(`# tests ${tests}`);
    write(`# pass ${pass}`);
    write(`# fail ${fail}`);

    stream.end();

    return stream;
  }
}

const createHarness = () => {
  const harness = new Harness();

  const result = (name: string, cb: () => void) => harness.addTest(name, cb);
  result.createStream = () => harness.createStream();
  return result;
};
createHarness._queue = [];

const tapava = {
  createHarness
};

module.exports = tapava; // eslint-disable-line import/no-commonjs
