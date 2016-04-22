# tapava

**tapava** gives you an [ava](https://www.npmjs.com/package/ava)-inspired api availalbe using tape.

This is, for example, great if you want your tests to be runnable in the browser.

## Example/Usage

```js
import test from 'tapava';

test('beep boop', t => {
  t.deepEqual({foo: 'bar'}, {foo: 'bas'});
});
```

Run the test using [babel-tape-runner](https://www.npmjs.com/package/babel-tape-runner). You need to add your own `.babelrc` file - tapava doesn't come preconfigured like ava does.

```shell
babel-tape-runner test.js
```

## License
MIT
