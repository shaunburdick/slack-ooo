'use strict';

const test = require('tape');
const Bot = require('../lib/bot');
const config = require('../config.default');

test('Bot: Instantiation', (assert) => {
  const bot = new Bot(config);

  assert.ok(bot, 'Bot should instantiate with default config');

  assert.end();
});
