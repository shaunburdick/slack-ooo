/// <reference path="../typings/tsd.d.ts" />
var logger = require('./logger');
var OOO_User = (function () {
    /**
     * Constructor
     *
     * @param string username the name of the user
     */
    function OOO_User(username) {
        this.username = username;
        this.STATUS_UNCONFIRMED = 'unconfirmed';
        this.STATUS_AWAITING_CONFIRMATION = 'awaiting_confirmation';
        this.STATUS_AWAITING_MESSAGE = 'awaiting_message';
        this.STATUS_REGISTERED = 'registered';
        this.STATUS_AWAITING_DEREGISTER = 'awaiting_deregister';
        this.status = this.STATUS_UNCONFIRMED;
        this.MESSAGE_TIMEOUT = 60000; // Five minutes
        this.DEREGISTER_TIMEOUT = 60000; // Five minutes
        this.POSITIVE_REGEXP = /(yes|ok|sure|yeah)/i;
        this.NEGATIVE_REGEXP = /(no|negative)/i;
        this.last_communication = new Date();
    }
    /**
     * Check if the user is out of the office
     *
     * @return boolean
     */
    OOO_User.prototype.isOOO = function () {
        var retVal = false;
        var now = new Date();
        retVal = (this.ooo_start && this.ooo_start < now);
        if (this.ooo_end) {
            retVal = retVal && (this.ooo_end > now);
        }
        return retVal;
    };
    /**
     * Handle a direct message to the bot
     *
     * @param string message
     * @return string
     */
    OOO_User.prototype.handleMessage = function (message) {
        var retVal = '';
        if (message.match(/help/i)) {
            retVal = '*Out of Office Bot*\n\n';
            retVal += 'I can keep track of when you are out of the office and tell people that mention you.\n\n';
            retVal += '*Usage*:\n';
            retVal += 'To set yourself out of office, say hello and follow my prompts!\n';
            retVal += 'To return to the office once you are back, say hello again!';
        }
        else {
            switch (this.status) {
                case this.STATUS_UNCONFIRMED:
                    this.status = this.STATUS_AWAITING_CONFIRMATION;
                    retVal = "Hello and welcome to Out of Office Bot!\n";
                    retVal += "You can ask for help at any time by saying `help`\n\n";
                    retVal += "I don't have you as out of office. Would you like to set yourself Out of Office? [Yes/No]";
                    break;
                case this.STATUS_AWAITING_CONFIRMATION:
                    if (message.match(this.POSITIVE_REGEXP)) {
                        this.status = this.STATUS_AWAITING_MESSAGE;
                        this.ooo_start = new Date();
                        retVal = "Sweet. You are now marked Out of Office with no message.\n";
                        retVal += "If you would like to set your Out of Office message, send it to me now";
                    }
                    else if (message.match(this.NEGATIVE_REGEXP)) {
                        this.status = this.STATUS_UNCONFIRMED;
                        retVal = "Fine. Be that way";
                    }
                    break;
                case this.STATUS_AWAITING_MESSAGE:
                    if ((new Date().getTime() - this.last_communication.getTime()) < this.MESSAGE_TIMEOUT) {
                        this.message = message;
                        this.status = this.STATUS_REGISTERED;
                        retVal = "Setting your OOO Message to:\n" + message;
                    }
                    else {
                        // set status to registered and handle it again
                        this.status = this.STATUS_REGISTERED;
                        retVal = this.handleMessage(message);
                    }
                    break;
                case this.STATUS_REGISTERED:
                    retVal = 'Hello! I have you marked as OOO. Would you like to turn that off? [Yes/No]';
                    this.status = this.STATUS_AWAITING_DEREGISTER;
                    break;
                case this.STATUS_AWAITING_DEREGISTER:
                    if ((new Date().getTime() - this.last_communication.getTime()) < this.MESSAGE_TIMEOUT) {
                        if (message.match(this.POSITIVE_REGEXP)) {
                            this.status = this.STATUS_UNCONFIRMED;
                            this.ooo_start = null;
                            this.ooo_end = null;
                            retVal = "Welcome back! You are no longer marked as out of the office.";
                        }
                        else if (message.match(this.NEGATIVE_REGEXP)) {
                            this.status = this.STATUS_REGISTERED;
                            retVal = "Ok, then get out of here!";
                        }
                    }
                    else {
                        retVal = "I haven't heard from you in a while? Are you trying to return to the office? [Yes/No]";
                    }
                    break;
                default:
                    logger.error("Unknown status: " + this.status);
                    this.status = this.STATUS_UNCONFIRMED;
            }
        }
        this.last_communication = new Date();
        return retVal;
    };
    return OOO_User;
})();
module.exports = OOO_User;
