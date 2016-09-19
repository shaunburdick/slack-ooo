'use strict';

const test = require('tape');
const moment = require('moment');
const Bot = require('../lib/bot');
const config = require('../config.default');

test('Bot: Instantiation', (assert) => {
  const bot = new Bot(config);

  assert.ok(bot, 'Bot should instantiate with default config');

  assert.end();
});

test('Bot: Find ms until next time', (assert) => {
  const bot = new Bot(config);
  const curDate = moment();

  const times = [
    moment(curDate).subtract(4, 'hours').format('HH:mm'),
    moment(curDate).subtract(3, 'hours').format('HH:mm'),
    moment(curDate).subtract(2, 'hours').format('HH:mm'),
    moment(curDate).subtract(1, 'hours').format('HH:mm'),
    moment(curDate).add(1, 'hours').format('HH:mm'),
    moment(curDate).add(2, 'hours').format('HH:mm'),
    moment(curDate).add(3, 'hours').format('HH:mm'),
    moment(curDate).add(4, 'hours').format('HH:mm')
  ];

  // rounding because we are rarely on the minute
  assert.equal(
    Math.ceil(bot.msTillNextTime(times) / 100000), 36,
    'Next time should be about an hour away'
  );

  times.splice(4, 1); // remove one hour time
  assert.equal(
    Math.ceil(bot.msTillNextTime(times) / 100000), 72,
    'Next time should be about two hours away'
  );

  assert.equal(
    Math.ceil(bot.msTillNextTime(times.slice(0, 4)) / 1000000), 72,
    'Next time should be about 20 hours away'
  );

  assert.end();
});
