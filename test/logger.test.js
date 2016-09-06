'use strict';

const test = require('tape');

test('Logger: create an instance of logger', (assert) => {
  const logger = require(`${process.env.PWD}/lib/logger`)();
  assert.ok(logger);
  assert.end();
});
