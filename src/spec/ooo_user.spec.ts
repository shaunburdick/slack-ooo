/// <reference path="../typings/tsd.d.ts" />

import OOO_User = require('../lib/ooo_user');
import moment = require('moment');

describe ('OOO_User', () => {
  it('should instantiate and set username', () => {
    var user = new OOO_User('foo');
    expect(user.username).toEqual('foo');
    expect(user.status).toEqual(user.STATUS_UNCONFIRMED);
  })

  describe('Date Handling', () => {
    var user: OOO_User;
    var now = moment();

    beforeEach(() => {
      user = new OOO_User('foo');
    })

    it('should parse a date', () => {
      expect(user.parseDate('2015-03-03').isValid()).toBeTruthy();
      expect(user.parseDate('Next Tuesday').isValid()).toBeTruthy();
      expect(user.parseDate('Yesterday').isValid()).toBeTruthy();
      expect(user.parseDate('3pm').isValid()).toBeTruthy();
      expect(user.parseDate('derp').isValid()).toBeFalsy();
    })

    it('should show ms since last communication', () => {
      user.last_communication = moment().subtract(10, 'minutes');
      expect(user.lastCommunication()).toBeGreaterThan(0);
    })

    describe('Out of Office Start', () => {
      it('should set the time to now if no string passed', () => {
        user.setStart();
        expect(moment.isMoment(user.ooo_start)).toBeTruthy();
      })

      it('should set the time to the time specified', () => {
        var strTime = '1982-05-20';
        var momentTime = user.parseDate(strTime);
        user.setStart(strTime);
        expect(user.ooo_start.isSame(momentTime)).toBeTruthy();
      })
    })

    describe('Out of Office End', () => {
        it('should set the time to now if no string passed', () => {
            user.setEnd();
            expect(moment.isMoment(user.ooo_end)).toBeTruthy();
        })

        it('should set the time to the time specified', () => {
            var strTime = '1982-05-20';
            var momentTime = user.parseDate(strTime);
            user.setEnd(strTime);
            expect(user.ooo_end.isSame(momentTime)).toBeTruthy();
        })
    })
  });

  describe('Command Parsing', () => {
    var user: OOO_User;

    beforeEach(() => {
      user = new OOO_User('foo');
    })

    it('should return help info', () => {
      expect(user.handleMessage('help')).toEqual(user.getHelp());
    })

    it('should parse the start command', () => {
      expect(user.parseCommands('start: foo')).toEqual({
        start: 'foo'
      })
    })

    it('should parse the end command', () => {
      expect(user.parseCommands('end: foo')).toEqual({
        end: 'foo'
      })
    })

    it('should parse the end command', () => {
      expect(user.parseCommands('message: foo')).toEqual({
        message: 'foo'
      })
    })

    it('should parse start and end time from message', () => {
      var message = 'message: I am OOO starting tomorrow until next Monday at 8am';
      user.handleMessage(message);

      expect(moment.isMoment(user.ooo_start)).toBeTruthy();
      expect(moment.isMoment(user.ooo_end)).toBeTruthy();
    })

    it('should parse multiple commands', () => {
      expect(user.parseCommands('message: foo bar fizz buzz start: s end: e')).toEqual({
        message: 'foo bar fizz buzz',
        start: 's',
        end: 'e'
      })
    })
  })

  describe('Out of Office Flagging', () => {
    var user: OOO_User;
    var now = moment();

    beforeEach(() => {
      user = new OOO_User('foo');
    })

    it('should start out in the office', () => {
      expect(user.isOOO()).toBeFalsy();
    })

    it('should be out of office if start date is less than now', () => {
      user.setStart();
      user.ooo_start.subtract(10, 'minutes');

      expect(user.isOOO()).toBeTruthy();
    })

    it('should not be out of office if end date is less than now', () => {
      user.setStart();
      user.ooo_start.subtract(10, 'minutes');

      user.setEnd();
      user.ooo_end.subtract(5, 'minutes');

      expect(user.isOOO()).toBeFalsy();
    })
  })

  describe('Message Handling', () => {
    var user: OOO_User;

    beforeEach(() => {
      user = new OOO_User('foo');
    })

    it('should react to the message command', () => {
      spyOn(user, 'setMessage').and.callThrough();
      user.handleMessage('message: foo');
      expect(user.setMessage).toHaveBeenCalled();
      expect(user.message).toEqual('foo');
    })

    it('should react to the start command', () => {
      spyOn(user, 'setStart').and.callThrough();
      user.handleMessage('start: 2015-05-20');
      expect(user.setStart).toHaveBeenCalled();
      expect(moment.isMoment(user.ooo_start)).toBeTruthy();
    })

    it('should react to the end command', () => {
      spyOn(user, 'setEnd').and.callThrough();
      user.handleMessage('end: 2015-05-20');
      expect(user.setEnd).toHaveBeenCalled();
      expect(moment.isMoment(user.ooo_end)).toBeTruthy();
    })

    it('should react to multiple commands', () => {
      spyOn(user, 'setMessage').and.callThrough();
      spyOn(user, 'setStart').and.callThrough();
      spyOn(user, 'setEnd').and.callThrough();

      user.handleMessage('message: foo bar fizz buzz start: s end: e');
      expect(user.setMessage).toHaveBeenCalled();
      expect(user.setStart).toHaveBeenCalled();
      expect(user.setEnd).toHaveBeenCalled();
    })

    it('should set the last communication time after each message', () => {
      user.last_communication.subtract(10, 'minutes');
      var last_comm = user.last_communication

      user.handleMessage('foo');
      expect(typeof user.last_communication).toEqual('object');
      expect(user.last_communication.isAfter(last_comm)).toBeTruthy();
    })

    it('should transition from unconfirmed to awaiting confirmation', () => {
      expect(user.status).toEqual(user.STATUS_UNCONFIRMED);
      user.handleMessage('foo');
      expect(user.status).toEqual(user.STATUS_AWAITING_CONFIRMATION);
    })

    it('should transition from awaiting confirmation to awaiting message after positive response', () => {
      user.status = user.STATUS_AWAITING_CONFIRMATION;
      user.handleMessage('yes');
      expect(user.status).toEqual(user.STATUS_AWAITING_MESSAGE);

      user.status = user.STATUS_AWAITING_CONFIRMATION;
      user.handleMessage('sure, why not');
      expect(user.status).toEqual(user.STATUS_AWAITING_MESSAGE);

      user.status = user.STATUS_AWAITING_CONFIRMATION;
      user.handleMessage('foo');
      expect(user.status).not.toEqual(user.STATUS_AWAITING_MESSAGE);
    })

    it('should transition from awaiting message to registered after receiveing a message', () => {
      var message = 'This is my message';
      user.last_communication = moment();

      user.status = user.STATUS_AWAITING_MESSAGE;
      user.handleMessage(message);
      expect(user.status).toEqual(user.STATUS_REGISTERED);
      expect(user.message).toEqual(message);
    })

    it('should not accept a message after the timeout', () => {
      var message = 'This is my message';
      var aWhileAgo = moment().subtract(10, 'minutes');

      user.status = user.STATUS_AWAITING_MESSAGE;
      user.last_communication = aWhileAgo;

      user.handleMessage(message);
      expect(user.status).toBe(user.STATUS_AWAITING_DEREGISTER);
      expect(user.message).toBeUndefined();
    })

    it('should transition from registered to awaiting deregister', () => {
      user.status = user.STATUS_REGISTERED;

      user.handleMessage('foo');
      expect(user.status).toEqual(user.STATUS_AWAITING_DEREGISTER);
    })

    it('should transition from awaiting deregister to unconfirmed after positive response', () => {
      user.status = user.STATUS_AWAITING_DEREGISTER;
      user.handleMessage('yes');
      expect(user.status).toEqual(user.STATUS_UNCONFIRMED);

      user.status = user.STATUS_AWAITING_DEREGISTER;
      user.handleMessage('foo');
      expect(user.status).toEqual(user.STATUS_AWAITING_DEREGISTER);
    })

    it('should transition from awaiting deregister to registers after negative response', () => {
      user.status = user.STATUS_AWAITING_DEREGISTER;
      user.handleMessage('no');
      expect(user.status).toEqual(user.STATUS_REGISTERED);

      user.status = user.STATUS_AWAITING_DEREGISTER;
      user.handleMessage('foo');
      expect(user.status).toEqual(user.STATUS_AWAITING_DEREGISTER);
    })
  })
})