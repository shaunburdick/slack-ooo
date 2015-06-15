/// <reference path="../typings/tsd.d.ts" />
var OOO_User = require('../lib/ooo_user');
describe('OOO_User', function () {
    it('should instantiate and set username', function () {
        var user = new OOO_User('foo');
        expect(user.username).toEqual('foo');
        expect(user.status).toEqual(user.STATUS_UNCONFIRMED);
    });
    describe('Out of Office Flagging', function () {
        var user;
        var now = new Date();
        beforeEach(function () {
            user = new OOO_User('foo');
        });
        it('should start out in the office', function () {
            expect(user.isOOO()).toBeFalsy();
        });
        it('should be out of office if start date is less than now', function () {
            user.ooo_start = new Date();
            user.ooo_start.setMinutes(now.getMinutes() - 10);
            expect(user.isOOO()).toBeTruthy();
        });
        it('should not be out of office if end date is less than now', function () {
            user.ooo_start = new Date();
            user.ooo_start.setMinutes(now.getMinutes() - 10);
            user.ooo_end = new Date();
            user.ooo_end.setMinutes(now.getMinutes() - 5);
            expect(user.isOOO()).toBeFalsy();
        });
    });
    describe('Message Handling', function () {
        var user;
        beforeEach(function () {
            user = new OOO_User('foo');
        });
        it('should set the last communication time after each message', function () {
            user.last_communication.setMinutes(user.last_communication.getMinutes() - 10);
            var last_comm = user.last_communication;
            user.handleMessage('foo');
            expect(typeof user.last_communication).toEqual('object');
            expect(user.last_communication.getTime()).toBeGreaterThan(last_comm.getTime());
        });
        it('should transition from unconfirmed to awaiting confirmation', function () {
            expect(user.status).toEqual(user.STATUS_UNCONFIRMED);
            user.handleMessage('foo');
            expect(user.status).toEqual(user.STATUS_AWAITING_CONFIRMATION);
        });
        it('should transition from awaiting confirmation to awaiting message after positive response', function () {
            user.status = user.STATUS_AWAITING_CONFIRMATION;
            user.handleMessage('yes');
            expect(user.status).toEqual(user.STATUS_AWAITING_MESSAGE);
            user.status = user.STATUS_AWAITING_CONFIRMATION;
            user.handleMessage('sure, why not');
            expect(user.status).toEqual(user.STATUS_AWAITING_MESSAGE);
            user.status = user.STATUS_AWAITING_CONFIRMATION;
            user.handleMessage('foo');
            expect(user.status).not.toEqual(user.STATUS_AWAITING_MESSAGE);
        });
        it('should transition from awaiting message to registered after receiveing a message', function () {
            var message = 'This is my message';
            user.last_communication = new Date();
            user.status = user.STATUS_AWAITING_MESSAGE;
            user.handleMessage(message);
            expect(user.status).toEqual(user.STATUS_REGISTERED);
            expect(user.message).toEqual(message);
        });
        it('should not accept a message after the timeout', function () {
            var message = 'This is my message';
            var aWhileAgo = new Date();
            aWhileAgo.setMinutes(aWhileAgo.getMinutes() - 10);
            user.status = user.STATUS_AWAITING_MESSAGE;
            user.last_communication = aWhileAgo;
            user.handleMessage(message);
            expect(user.status).toBe(user.STATUS_AWAITING_DEREGISTER);
            expect(user.message).toBeUndefined();
        });
        it('should transition from registered to awaiting deregister', function () {
            user.status = user.STATUS_REGISTERED;
            user.handleMessage('foo');
            expect(user.status).toEqual(user.STATUS_AWAITING_DEREGISTER);
        });
        it('should transition from awaiting deregister to unconfirmed after positive response', function () {
            user.status = user.STATUS_AWAITING_DEREGISTER;
            user.handleMessage('yes');
            expect(user.status).toEqual(user.STATUS_UNCONFIRMED);
            user.status = user.STATUS_AWAITING_DEREGISTER;
            user.handleMessage('foo');
            expect(user.status).toEqual(user.STATUS_AWAITING_DEREGISTER);
        });
        it('should transition from awaiting deregister to registers after negative response', function () {
            user.status = user.STATUS_AWAITING_DEREGISTER;
            user.handleMessage('no');
            expect(user.status).toEqual(user.STATUS_REGISTERED);
            user.status = user.STATUS_AWAITING_DEREGISTER;
            user.handleMessage('foo');
            expect(user.status).toEqual(user.STATUS_AWAITING_DEREGISTER);
        });
    });
});
