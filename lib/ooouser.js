'use strict';

const logger = require('./logger')();
const moment = require('moment');
const chrono = require('chrono-node');

const STATUS_UNCONFIRMED = 'unconfirmed';
const STATUS_AWAITING_CONFIRMATION = 'awaiting_confirmation';
const STATUS_AWAITING_MESSAGE = 'awaiting_message';
const STATUS_REGISTERED = 'registered';
const STATUS_AWAITING_DEREGISTER = 'awaiting_deregister';

const COMMAND_MESSAGE = 'message';
const COMMAND_START = 'start';
const COMMAND_END = 'end';

const TIMEOUT_MESSAGE = 60000; // five minutes
const TIMEOUT_DEREGISTER = 60000; // five minutes

const POSITIVE_REGEXP = /(yes|ok|sure|yeah)/i;
const NEGATIVE_REGEXP = /(no|nope|negative)/i;

/**
 * @module OOOUser
 */
class OOOUser {
  /**
   * @constructor
   *
   * @param {string} username The username of the user
   */
  constructor (username) {
    this.username = username;
    this.last_communication = moment();
    this.status = STATUS_UNCONFIRMED;
    this.message = null;
    this.ooo_start = null;
    this.ooo_end = null;
    this.last_response = {};
  }

  /**
   * Check if the user is out of the Office
   *
   * @return {boolean} True if out of office
   */
  isOOO () {
    let retVal = false;

    const now = moment();

    // check if start is in past
    retVal = (this.ooo_start && this.ooo_start.isBefore(now));

    // check if end is set and that it is in Future
    if (this.ooo_end) {
      retVal = retVal && (this.ooo_end.isAfter(now));
    }

    return retVal;
  }

  /**
   * Gets the ms since last communication
   *
   * @return {integer} The # of ms since last communication
   */
  lastCommunication () {
    return this.last_communication
      ? moment().diff(this.last_communication) : 0;
  }

  /**
   * Parse a string into a moment date
   *
   * @param {string} strDate the date string
   * @return {Moment} A moment date, if unable to parse date it will return an invalid moment object
   */
  parseDate (strDate) {
    const pDate = chrono.parseDate(strDate);
    return pDate ? moment(pDate) : moment.invalid();
  }

  /**
   * Set the User's OOO message and return a response
   *
   * @param {string} message The message to set
   * @return {string} a response for the user
   */
  setMessage (message) {
    this.message = message;

    return `Setting your OOO Message to:\n${message}`;
  }

  /**
   * Set the start of the user's OOO
   *
   * @param {string} start A parsable date/time string
   * @return {string} A response for the user
   */
  setStart (start) {
    var retVal = `Unable to parse '${start}' into a valid date/time`;
    let time;

    if (start) {
      time = this.parseDate(start);
    } else {
      time = moment();
    }

    if (time.isValid()) {
      this.ooo_start = time;
      retVal = `You ${time.isBefore() ? 'are' : 'will be'} marked Out of Office at ${time.calendar()}`;
    }

    return retVal;
  }

  /**
   * Set the end of the user's OOO
   *
   * @param {string} end A parseable date/time string
   * @return {string} A response for the user
   */
  setEnd (end) {
    var retVal = `Unable to parse ${end} into a valid date/time`;
    let time;

    if (end) {
      time = this.parseDate(end);
    } else {
      time = moment();
    }

    if (time.isValid()) {
      this.ooo_end = time;
      if (time.isBefore()) {
        retVal = 'You are no longer marked Out of Office';
      } else {
        if (!this.ooo_start) {
          // Set the start time to now
          this.ooo_start = moment();
        }
        retVal = `You are marked Out of Office returning on ${time.calendar()}`;
      }
    }

    return retVal;
  }

  /**
   * Parse any commands and their values from a message.
   *
   * @param {string} message The raw message
   * @return {string[]}
   */
  parseCommands (message) {
    const retVal = {};

    const splits = message.split(/(start:|end:|message:)/);
    let curCommand;

    for (let x in splits) {
      switch (splits[x].toLowerCase()) {
        case 'message:':
        case 'start:':
        case 'end:':
          curCommand = splits[x].toLowerCase().replace(':', '');
          break;
        default:
          if (curCommand) {
            retVal[curCommand] = splits[x].trim();
          }
      }
    }

    // If no start/end dates, try to parse the message
    if (retVal.hasOwnProperty(COMMAND_MESSAGE)) {
      var parsedMessage = chrono.parse(message);
      if (parsedMessage && parsedMessage[0]) {
        if (!retVal.hasOwnProperty(COMMAND_START) &&
            parsedMessage[0].start
        ) {
          retVal[COMMAND_START] = this.setStart(parsedMessage[0].start.date().toString());
        }

        if (!retVal.hasOwnProperty(COMMAND_END)) {
          // check for end of first pass parsing
          if (parsedMessage[0].end) {
            retVal[COMMAND_END] = this.setEnd(parsedMessage[0].end.date().toString());
          } else {
            // remove first match and parse again
            parsedMessage = chrono.parse(message.replace(parsedMessage[0].text, ''));
            if (
              parsedMessage && parsedMessage[0] &&
                parsedMessage[0].start
            ) {
              retVal[COMMAND_END] = this.setEnd(parsedMessage[0].start.date().toString());
            }
          }
        }
      }
    }

    return retVal;
  }

  /**
   * Return some help flavor text.
   *
   * @return {string}
   */
  getHelp () {
    var retVal = '';

    retVal = '*Out of Office Bot*\n\n';
    retVal += 'I can keep track of when you are out of the office and tell people that mention you.\n\n';
    retVal += '*Usage*:\n';
    retVal += 'To set yourself out of office, say hello and follow my prompts!\n';
    retVal += 'To return to the office once you are back, say hello again!\n\n';
    retVal += '*Direct Commands:*\n';
    retVal += '- message: _string_, To set your Out of Office message\n';
    retVal += '           Example: `message: I am out of the office`\n';
    retVal += '- start:   _string_, A parsable date/time string when your Out of Office begins\n';
    retVal += '           Example: `start: 2015-06-06 8:00`\n';
    retVal += '- end:     _string_, A parsable date/time string when your Out of Office ends\n';
    retVal += '           Example: `end: 2015-06-06 16:00`\n';

    return retVal;
  }

  /**
   * Handle a direct message to the bot
   *
   * @param {string} message
   * @return {string}
   */
  handleMessage (message) {
    var retVal = '';
    var commands = this.parseCommands(message);

    if (message.match(/^help/i)) {
      retVal = this.getHelp();
    } else if (Object.keys(commands).length) {
      for (var command in commands) {
        switch (command) {
          case COMMAND_MESSAGE:
            retVal += `-${this.setMessage(commands[command])}\n`;
            break;
          case COMMAND_START:
            retVal += `-${this.setStart(commands[command])}\n`;
            break;
          case COMMAND_END:
            retVal += `-${this.setEnd(commands[command])}\n`;
            break;
          default:
            retVal += `-Error: Unknown comand: ${command}\n`;
            logger.error(`Unknown command: ${command}`);
        }
      }

      if (retVal) { // we found something
        this.status = STATUS_REGISTERED;
      }
    } else {
      switch (this.status) {
        case STATUS_UNCONFIRMED:
          this.status = STATUS_AWAITING_CONFIRMATION;
          retVal = 'Hello and welcome to Out of Office Bot!\n';
          retVal += 'You can ask for help at any time by saying `help`\n\n';
          retVal += `I don't have you as out of office. Would you like to set yourself Out of Office? [Yes/No]`;
          break;
        case STATUS_AWAITING_CONFIRMATION:
          if (message.match(POSITIVE_REGEXP)) {
            this.status = STATUS_AWAITING_MESSAGE;
            this.setStart();
            retVal = 'Sweet. You are now marked Out of Office starting now with no message.\n';
            retVal += 'If you would like to set your Out of Office message, send it to me now';
          } else if (message.match(NEGATIVE_REGEXP)) {
            this.status = STATUS_UNCONFIRMED;
            retVal = `Fine. Be that way`;
          }
          break;
        case STATUS_AWAITING_MESSAGE:
          if (this.lastCommunication() < TIMEOUT_MESSAGE) {
            this.status = STATUS_REGISTERED;
            retVal = this.setMessage(message);
          } else {
            // set status to registered and handle it again
            this.status = STATUS_REGISTERED;
            retVal = this.handleMessage(message);
          }
          break;
        case STATUS_REGISTERED:
          retVal = 'Hello! I have you marked as OOO. Would you like to turn that off? [Yes/No]';
          this.status = STATUS_AWAITING_DEREGISTER;
          break;
        case STATUS_AWAITING_DEREGISTER:
          if (this.lastCommunication() < TIMEOUT_MESSAGE) {
            if (message.match(POSITIVE_REGEXP)) {
              this.status = STATUS_UNCONFIRMED;
              this.ooo_start = null;
              this.ooo_end = null;
              retVal = `Welcome back! You are no longer marked as out of the office.`;
            } else if (message.match(NEGATIVE_REGEXP)) {
              this.status = STATUS_REGISTERED;
              retVal = `Ok, then get out of here!`;
            }
          } else {
            retVal = "I haven't heard from you in a while? Are you trying to return to the office? [Yes/No]";
          }

          break;
        default:
          logger.error(`Unknown status: ${this.status}`);
          this.status = STATUS_UNCONFIRMED; // try to recover
      }
    }

    this.last_communication = moment();

    return retVal;
  }
}

// Make constants accessible
OOOUser.STATUS_UNCONFIRMED = STATUS_UNCONFIRMED;
OOOUser.STATUS_AWAITING_CONFIRMATION = STATUS_AWAITING_CONFIRMATION;
OOOUser.STATUS_AWAITING_MESSAGE = STATUS_AWAITING_MESSAGE;
OOOUser.STATUS_REGISTERED = STATUS_REGISTERED;
OOOUser.STATUS_AWAITING_DEREGISTER = STATUS_AWAITING_DEREGISTER;

OOOUser.COMMAND_MESSAGE = COMMAND_MESSAGE;
OOOUser.COMMAND_START = COMMAND_START;
OOOUser.COMMAND_END = COMMAND_END;

OOOUser.TIMEOUT_MESSAGE = TIMEOUT_MESSAGE;
OOOUser.TIMEOUT_DEREGISTER = TIMEOUT_DEREGISTER;

OOOUser.POSITIVE_REGEXP = POSITIVE_REGEXP;
OOOUser.NEGATIVE_REGEXP = NEGATIVE_REGEXP;

module.exports = OOOUser;
