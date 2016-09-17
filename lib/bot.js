'use strict';

const Botkit = require('botkit');
const moment = require('moment');
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

    this.nextAnnounce = null; // timeout pointer
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
    let retVal = 'The following users are out of office:\n';
    let found = false;

    users = users || Array.from(this.ooo_users.keys());

    for (let x in users) {
      let oooUser = this.ooo_users.get(users[x]);
      if (oooUser && oooUser.isOOO()) {
        const user = this.lookup.get(users[x]);
        const userName = user ? user.profile.real_name : 'UNKNOWN_USER';
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
      logger.info('Announcing offline from message:', message);
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
      logger.info('Responding to message:', response, message);
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
      const matches = message.text.match(/@\w+/g);
      if (matches && matches.length) {
        const translatedUsers = matches.map((user) => user.replace('@', ''));
        const oooResponse = this.announceOffline(translatedUsers);
        if (oooResponse) {
          this.bot.reply(message, oooResponse);
          logger.info('Responding to mention:', oooResponse, message);
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
   * Start the loop to announce offline users
   *
   * @return {null}
   */
  startAnnounceLoop () {
    const self = this;

    // Check to see if we have any channels and times
    if (this.config.app.announce.channels.length && this.config.app.announce.times.length) {
      const nextInterval = this.msTillNextTime(this.config.app.announce.times);
      if (nextInterval > 0) {
        logger.info(`Next announcement in: ${moment.duration(nextInterval).humanize()}`);
        this.nextAnnounce = setTimeout(() => {
          logger.info('Announcing on schedule to:', this.config.app.announce.channels);
          // loop through channels and announce
          self.config.app.announce.channels.forEach((channel) => {
            // find the channel id
            this.lookup.forEach((item) => {
              // only announce on channel or group
              if (
                (item.is_channel || item.is_group) && // channel or group
                self.config.app.announce.channels.indexOf(item.name) !== -1
              ) {
                // send message to channel
                logger.info(`Announcing offline on channel: ${item.name}(${item.id})`);
                self.bot.say({
                  channel: item.id,
                  text: self.announceOffline()
                });
              }
            });
          });
          self.startAnnounceLoop();
        }, nextInterval);
      }
    } else {
      logger.info('Not activating announce loop, No channels or times set');
    }
  }

  /**
   * Returns the number of milleseconds until the next time
   *
   * @param  {string[]} times a list of times
   * @return {integer}  number of milleseconds until next time in list
   */
  msTillNextTime (times) {
    let retVal = -1;

    if (times.length) {
      const curTime = moment();
      times.forEach((time) => {
        const mTime = moment(time, 'HH:mm');
        if (mTime.isBefore()) { // if we passed this time today
          mTime.add(24, 'hours'); // move it to tomorrow
        }

        const diff = mTime.diff(curTime);
        if (retVal === -1 || retVal > diff) {
          retVal = diff; // we have a new winner
        }
      });
    }

    return retVal;
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

    this.controller.on('direct_mention,mention', (bot, message) => {
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
      this.startAnnounceLoop();
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

    if (this.nextInterval) {
      clearTimeout(this.nextInterval); // stop announcement loop
    }

    return this;
  }
}

module.exports = Bot;
