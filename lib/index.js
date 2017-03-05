// @flow

import inspect from 'object-inspect';

import type Test from './test';
import Harness from './harness';

export type CustomMetaType = {
  message: string,
  operator: string,
  actual?: any,
  expected?: any,
  notExpected?: any,
};

export type CallbackType = (Test) => (void | Promise<void>);

export type QueueType = Array<{ name: string, cb: CallbackType }>;

export type FailMetaType = {
  operator: string,
  actual?: string,
  expected?: string,
  notExpected?: string,
};

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

export default tapava;
