// @flow

import { PassThrough } from 'stream';
import type { Readable } from 'stream';

type CallbackType = () => void;

class Harness {
  constructor () {
    this.queue = [];
  }
  queue: Array<{ name: string, cb: CallbackType }>

  runTest (name: string, cb: () => void): void {
    this.queue.push({ name, cb });
  }

  createStream (): Readable {
    const stream = new PassThrough({ encoding: 'utf8' });

    stream.write('TAP version 13\n');

    this.queue.forEach(({ name }) => {
      stream.write(`# ${name}\n`);
    });
    stream.end();

    return stream;
  }
}

const createHarness = () => {
  const harness = new Harness();

  const result = (name: string, cb: () => void) => harness.runTest(name, cb);
  result.createStream = () => harness.createStream();
  return result;
};
createHarness._queue = [];

const tapava = {
  createHarness
};

module.exports = tapava; // eslint-disable-line import/no-commonjs
