// @flow
import type { Readable } from 'stream';
import Result from './result';
import type { CallbackType, QueueType } from './';

export default class Harness {
  constructor () {
    this.queue = [];
    this.only = [];
  }
  errorCount: number
  queue: QueueType
  only: QueueType

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
