'use strict';

const Botkit = require('botkit');
const logger = require('./logger')();
const OOOUser = require('./ooouser');

/**
 * @module Bot
 */
class Bot {
  /**
   * Constructor.
   *
   * @constructor
   * @param {object} config The final configuration for the bot
   */
  constructor (config) {
    this.config = config;
    this.controller = Botkit.slackbot();

    this.lookup = new Map();

    this.ooo_users = new Map();
  }

  /**
   * Populates a quick lookup table.
   *
   * @param {object} payload The rtm.start payload
   * @return {Bot} returns itself
   */
  populateLookup (payload) {
    ['users', 'channels', 'groups', 'mpims'].forEach((type) => {
      if (payload[type]) {
        payload[type].forEach((item) => {
          this.lookup.set(item.id, item);
        });
      }
    });
  }

  /**
   * Function to be called on slack open
   *
   * @param {object} payload Connection payload
   * @return {Bot} returns itself
   */
  slackOpen (payload) {
    const channels = [];
    const groups = [];
    const mpims = [];

    logger.info(`Welcome to Slack. You are @${payload.self.name} of ${payload.team.name}`);

    if (payload.channels) {
      payload.channels.forEach((channel) => {
        if (channel.is_member) {
          channels.push(`#${channel.name}`);
        }
      });

      logger.info(`You are in: ${channels.join(', ')}`);
    }

    if (payload.groups) {
      payload.groups.forEach((group) => {
        groups.push(`${group.name}`);
      });

      logger.info(`Groups: ${groups.join(', ')}`);
    }

    if (payload.mpims) {
      payload.mpims.forEach((mpim) => {
        mpims.push(`${mpim.name}`);
      });

      logger.info(`Multi-person IMs: ${mpims.join(', ')}`);
    }

    return this;
  }

  /**
   * Announce offline users.
   *
   * @param {string[]} users Limit announcement to users
   * @return {string}
   */
  announceOffline (users) {
    var retVal = 'The following users are out of office:\n';
    var found = false;

    users = users || this.ooo_users.keys();

    for (let x in users) {
      let oooUser = this.ooo_users.get(users[x]);
      if (oooUser && oooUser.isOOO()) {
        const userName = this.lookup.get(users[x]) || 'UNKNOWN_USER';
        found = true;
        retVal += `> ${userName}: ${oooUser.message}\n`;
      }
    }

    return found ? retVal : '';
  }

  /**
   * Handle direct mention
   *
   * @param {object} message
   * @return {null}
   */
  handleDirectMention (message) {
    if (message.text.match(/who/i)) {
      this.bot.reply(message, this.announceOffline());
    }
  }

  /**
   * Handle direct command
   *
   * @param {object} message
   * @return {null}
   */
  handleDirectCommand (message) {
    // Start a new user
    if (!this.ooo_users.get(message.user)) {
      this.ooo_users.set(message.user, new OOOUser(message.user));
    }

    const response = this.ooo_users.get(message.user).handleMessage(message.text);

    if (response) {
      this.bot.reply(message, response);
    }
  }

  /**
   * Handle an incoming message
   * @param {object} message The incoming message from Slack
   * @return {Bot} returns itself
   */
  handleMessage (message) {
    if (message.user === `@${this.bot.identity.id}`) {
      // ignore your own messages, also you are supposed to be OoO!
    } else if (message.type === 'message' && (message.text) && (message.channel !== null)) {
      const matches = message.text.math(/@\w+/g);
      if (matches.length) {
        const translatedUsers = matches.map((user) => user.replace('@', ''));
        const oooResponse = this.announceOffline(translatedUsers);
        if (oooResponse) {
          this.bot.reply(message, oooResponse);
        }
      }
    } else {
      const typeError = message.type !== 'message' ? `Unexpected type: ${message.type}` : null;
      const textError = !message.text ? 'text was undefined' : null;
      const channelError = message.channel === null ? 'channel was undefined.' : null;
      const errors = [typeError, textError, channelError].filter((element) => {
        return element !== null;
      }).join(' ');
      logger.info(`@${this.bot.identity.name} could not respond. ${errors}`);
    }

    return this;
  }

  /**
   * Start the bot
   *
   * @return {Bot} returns itself
   */
  start () {
    this.controller.on('team_join,user_change,bot_group_join,bot_channel_join', (bot, message) => {
      if (message.user && message.user.id) {
        this.lookup.set(message.user.id, message.user);
      } else if (message.channel && message.channel.id) {
        this.lookup.set(message.channel.id, message.channel);
      }
    });

    this.controller.on('direct_message', (bot, message) => {
      this.handleDirectCommand(message);
    });

    this.controller.on('direct_mention', (bot, message) => {
      this.handleDirectMention(message);
    });

    this.controller.on('ambient,mention', (bot, message) => {
      this.handleMessage(message);
    });

    this.controller.on('rtm_close', () => {
      logger.info('The RTM api just closed');

      if (this.config.slack.autoReconnect) {
        this.connect();
      }
    });

    this.connect();

    return this;
  }

  /**
   * Connect to the RTM
   * @return {Bot} this
   */
  connect () {
    this.bot = this.controller.spawn({
      token: this.config.slack.token,
      no_unreads: true,
      mpim_aware: true
    }).startRTM((err, bot, payload) => {
      if (err) {
        logger.error('Error starting bot!', err);
      }

      this.payload = payload;
      this.populateLookup(payload);
      this.slackOpen(payload);
    });

    return this;
  }

  /**
   * Stop the bot
   *
   * @return {Bot} returns itself
   */
  stop () {
    this.bot.closeRTM();

    return this;
  }
}

module.exports = Bot;
