// @flow

import type Test from './test';
import Harness from './harness';

export type CustomMetaType = {
  message: string,
  operator: string,
  actual?: any,
  expected?: any,
  notExpected?: any,
};

export type CallbackType = (t: Test) => (void | Promise<void>);

export type QueueType = Array<{ name: string, cb: CallbackType, }>;

export type FailMetaType = {
  operator: string,
  actual?: string,
  expected?: string,
  notExpected?: string,
};

const createHarness = ({ callbackMode }: { callbackMode: boolean, } = { callbackMode: false }) => {
  const harness = new Harness({ callbackMode });

  const result = (name: string, cb: CallbackType) => harness.addTest(name, cb);
  result.createStream = () => harness.createStream();
  result.skip = () => {};
  result.only = (name: string, cb: CallbackType) => harness.addOnlyTest(name, cb);
  return result;
};

const tapava = {
  createHarness,
};

export default tapava;
