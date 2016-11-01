export default async (fn, promise, expected, message) => {
  try {
    await promise;
    fn(() => {}, expected, message);
  } catch (err) {
    fn(
      () => {
        throw err;
      },
      expected,
      message
    );
  }
};
