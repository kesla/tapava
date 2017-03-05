// @flow

import deepEqual from 'deep-equal';
import match from 'tmatch';

import formatCustomMeta from './format-custom-metadata';
import type { CustomMetaType } from './';
import type Result from './result';

export default class Test {
  constructor({ result }: { result: Result, }) {
    this._result = result;
  }

  _result: Result

  custom(assert: boolean, opts: CustomMetaType) {
    const { message } = opts;
    if (assert) {
      this._result.pass(message);
    } else {
      this._result.fail(
        message,
        formatCustomMeta(opts),
      );
    }
  }

  pass(message: string) {
    this.custom(true, { operator: 'pass', message });
  }

  fail(message: string) {
    this.custom(false, { operator: 'fail', message });
  }

  plan(count: number) {
    this._result.plan(count);
  }

  truthy(actual: any, message: string = 'should be truthy') {
    this.custom(
      !!actual,
      { operator: 'truthy', message, actual, expected: true },
    );
  }

  falsy(actual: any, message: string = 'should be falsy') {
    this.custom(
      !actual,
      { operator: 'falsy', message, actual, expected: false },
    );
  }

  true(actual: any, message: string = 'should be true') {
    this.custom(
      actual === true,
      { operator: 'true', message, actual, expected: true },
    );
  }

  false(actual: any, message: string = 'should be false') {
    this.custom(
      actual === false,
      { operator: 'false', message, actual, expected: false },
    );
  }

  is(actual: any, expected: any, message: string = 'should be strict equal') {
    this.custom(
      actual === expected,
      { operator: 'is', message, actual, expected },
    );
  }

  not(actual: any, notExpected: any, message: string = 'should not be strict equal') {
    this.custom(
      actual !== notExpected,
      { operator: 'not', message, actual, notExpected },
    );
  }

  deepEqual(actual: any, expected: any, message: string = 'should be deep equal') {
    this.custom(
      deepEqual(actual, expected),
      { operator: 'deepEqual', message, actual, expected },
    );
  }

  notDeepEqual(actual: any, notExpected: any, message: string = 'should not be deep equal') {
    this.custom(
      !deepEqual(actual, notExpected),
      { operator: 'notDeepEqual', message, actual, notExpected },
    );
  }

  match(actual: any, expected: any, message: string = 'should match') {
    this.custom(
      match(actual, expected),
      { operator: 'match', message, actual, expected },
    );
  }

  notMatch(actual: any, notExpected: any, message: string = 'should not match') {
    this.custom(
      !match(actual, notExpected),
      { operator: 'notMatch', message, actual, notExpected },
    );
  }
}
