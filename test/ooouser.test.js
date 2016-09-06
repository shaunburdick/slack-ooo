'use strict';

const OOOUser = require('../lib/ooouser');
const moment = require('moment');
const test = require('tape');

test('OOOUser: Should instantiate and set username', (assert) => {
  const user = new OOOUser('foo');
  assert.equal(user.username, 'foo', 'Username should be foo');
  assert.equal(user.status, OOOUser.STATUS_UNCONFIRMED, 'Status should be unconfirmed');

  assert.end();
});

test('OOOUser: Date Parsing', (assert) => {
  const user = new OOOUser('foo');

  assert.ok(user.parseDate('2015-03-03').isValid(), 'Parse YYYY-MM-DD');
  assert.ok(user.parseDate('Next Tuesday').isValid(), 'Parse Relative Future Date');
  assert.ok(user.parseDate('Yesterday').isValid(), 'Parse relative past date');
  assert.ok(user.parseDate('3pm').isValid(), 'Parse Time');
  assert.notOk(user.parseDate('derp').isValid(), 'Should not parse derp date');

  assert.end();
});

test('OOOUser: Show ms since last communication', (assert) => {
  const user = new OOOUser('foo');

  user.last_communication = moment().subtract(10, 'minutes');
  assert.ok(user.lastCommunication() > 0, 'Last communication should be greater than zero');

  assert.end();
});

test('OOOUser: Start Out of Office', (assert) => {
  const user1 = new OOOUser('user1');
  user1.setStart();
  assert.ok(moment.isMoment(user1.ooo_start), 'Start should be now if no time given');

  const user2 = new OOOUser('user2');
  const strTime = '1982-05-20';
  const momentTime = user2.parseDate(strTime);
  user2.setStart(strTime);
  assert.ok(user2.ooo_start.isSame(momentTime), 'Start should set time to that specified');

  assert.end();
});

test('OOOUser: End Out of Office', (assert) => {
  const user1 = new OOOUser('user1');
  user1.setEnd();
  assert.ok(moment.isMoment(user1.ooo_end), 'End should be now if no time given');

  const user2 = new OOOUser('user2');
  const strTime = '1982-05-20';
  const momentTime = user2.parseDate(strTime);
  user2.setEnd(strTime);
  assert.ok(user2.ooo_end.isSame(momentTime), 'End should set time to that specified');

  assert.end();
});

test('OOOUser: Command parsing', (assert) => {
  const user = new OOOUser('user');

  assert.equal(
    user.handleMessage('help'),
    user.getHelp(),
    'Parse the help command'
  );

  assert.deepEqual(
    user.parseCommands('start: foo'),
    { start: 'foo' },
    'Parse start time'
  );

  assert.deepEqual(
    user.parseCommands('end: foo'),
    { end: 'foo' },
    'Parse end time'
  );

  assert.deepEqual(
    user.parseCommands('message: foo'),
    { message: 'foo' },
    'Parse message'
  );

  const message = user.parseCommands(
    'message: I am OOO starting tomorrow until next Monday at 8am'
  );
  assert.ok(message.hasOwnProperty('start'), 'Parse a start from message');
  assert.ok(message.hasOwnProperty('end'), 'Parse an end from message');

  assert.deepEqual(
    user.parseCommands('message: foo bar fizz buzz start: s end: e'),
    {
      message: 'foo bar fizz buzz',
      start: 's',
      end: 'e'
    },
    'Parse multiple commands'
  );

  assert.end();
});

test('OOOUser: Out of Office Flagging', (assert) => {
  const user = new OOOUser('foo');

  assert.notOk(user.isOOO(), 'User should not be OOO on instantiation');

  user.setStart();
  user.ooo_start.subtract(10, 'minutes');

  assert.ok(user.isOOO(), 'User should be considered OOO if start is in past');

  user.setEnd();
  user.ooo_end.subtract(5, 'minutes');
  assert.notOk(user.isOOO(), 'User should not be considered OOO is end is in past');

  assert.end();
});

test('OOOUser: Message Handling', (assert) => {
  let user = new OOOUser('foo');

  user.handleMessage('message: foo');
  assert.equal(user.message, 'foo', 'Should handle message command');

  // reset user
  user = new OOOUser('foo');

  user.handleMessage('start: yesterday');
  assert.ok(moment.isMoment(user.ooo_start), 'Should handle start command');

  // reset user
  user = new OOOUser('foo');

  user.handleMessage('end: tomorrow');
  assert.ok(moment.isMoment(user.ooo_end), 'Should handle end command');

  // reset user
  user = new OOOUser('foo');

  user.handleMessage('message: foo bar fizz buzz start: yesterday end: tomorrow');
  assert.equal(user.message, 'foo bar fizz buzz', 'Should handle multiple commands: message');
  assert.ok(moment.isMoment(user.ooo_start), 'Should handle multiple commands: start');
  assert.ok(moment.isMoment(user.ooo_end), 'Should handle multiple commands: end');

  // reset user
  user = new OOOUser('foo');
  user.handleMessage('foo'); // prime
  assert.ok(moment.isMoment(user.last_communication), 'Last communication should be set on message');
  user.last_communication.subtract(10, 'minutes'); // move it back a bit
  const lastCom = user.last_communication;
  user.handleMessage('bar');
  assert.ok(user.last_communication.isAfter(lastCom), 'Last communication should be updated after message');

  assert.end();
});

test('OOOUser: Transitions - Awaiting Confirmation', (assert) => {
  let user = new OOOUser('foo');

  assert.equal(
    user.status, OOOUser.STATUS_UNCONFIRMED,
    'User should start unconfirmed'
  );

  user.handleMessage('foo');

  assert.equal(
    user.status, OOOUser.STATUS_AWAITING_CONFIRMATION,
    'User should transition from unconfirmed to awaiting confirmation'
  );

  user.status = OOOUser.STATUS_AWAITING_CONFIRMATION;
  user.handleMessage('yes');
  assert.equal(
    user.status, OOOUser.STATUS_AWAITING_MESSAGE,
    'Transition from awaiting confirmation to awaiting message: yes'
  );

  user.status = OOOUser.STATUS_AWAITING_CONFIRMATION;
  user.handleMessage('sure, why not');
  assert.equal(
    user.status, OOOUser.STATUS_AWAITING_MESSAGE,
    'Transition from awaiting confirmation to awaiting message: sure, why not'
  );

  user.status = OOOUser.STATUS_AWAITING_CONFIRMATION;
  user.handleMessage('foo');
  assert.notEqual(
    user.status, OOOUser.STATUS_AWAITING_MESSAGE,
    'Not transition from awaiting confirmation to awaiting message: foo'
  );

  assert.end();
});

test('OOOUser: Transitions - Awaiting Message', (assert) => {
  let user = new OOOUser('foo');

  user.status = OOOUser.STATUS_AWAITING_MESSAGE;
  user.handleMessage('a message');
  assert.equal(
    user.status, OOOUser.STATUS_REGISTERED,
    'Transition from awaiting message to registered'
  );

  user = new OOOUser('foo');
  user.status = OOOUser.STATUS_AWAITING_MESSAGE;
  user.last_communication = moment().subtract(10, 'minutes');
  user.handleMessage('a Message');
  assert.equal(
    user.status, OOOUser.STATUS_AWAITING_DEREGISTER,
    'Transition to deregister if interaction times out'
  );

  assert.end();
});

test('OOOUser: Transitions - Registered', (assert) => {
  let user = new OOOUser('foo');

  user.status = OOOUser.STATUS_REGISTERED;
  user.handleMessage('a message');
  assert.equal(
    user.status, OOOUser.STATUS_AWAITING_DEREGISTER,
    'Transition from registered to awaiting deregister'
  );

  assert.end();
});

test('OOOUser: Transitions - Awaiting Deregister', (assert) => {
  let user = new OOOUser('foo');

  user.status = OOOUser.STATUS_AWAITING_DEREGISTER;
  user.handleMessage('yes');
  assert.equal(
    user.status, OOOUser.STATUS_UNCONFIRMED,
    'Transition from awaiting deregister to unconfirmed n positive response'
  );

  user.status = OOOUser.STATUS_AWAITING_DEREGISTER;
  user.handleMessage('no');
  assert.equal(
    user.status, OOOUser.STATUS_REGISTERED,
    'Transition to Registered with negative/neutral response'
  );

  assert.end();
});
