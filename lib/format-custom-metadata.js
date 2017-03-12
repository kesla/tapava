// @flow

import inspect from 'object-inspect';

import type { CustomMetaType, FailMetaType } from './';

export default ({ operator, actual, expected, notExpected }: CustomMetaType): FailMetaType => {
  if (actual === undefined) {
    return { operator };
  }

  if (expected !== undefined) {
    return { operator, expected: inspect(expected), actual: inspect(actual) };
  }

  if (notExpected !== undefined) {
    return { operator, notExpected: inspect(notExpected), actual: inspect(actual) };
  }

  return { operator, actual: inspect(actual) };
};
