/// <reference path="../typings/tsd.d.ts" />

var Slack = require('slack-client');

import moment = require('moment');
import logger = require('./logger');
import Config = require('./ConfigInterface');
import OOO_User = require('./ooo_user');

class Bot {
  /** Slack object */
  slack: any;

  ooo_users: { [id: string]: OOO_User } = {};

  MIN_RESPONSE_TIME = 60000; // 5 minutes

  /**
   * Constructor.
   *
   * @param object config The final configuration for the bot
   */
  constructor (public config: Config) {
    this.slack = new Slack(
      config.slack.token,
      config.slack.autoReconnect,
      config.slack.autoMark
    );
  }

  /**
   * Announce offline users.
   *
   * @param string[] users Limit announcement to users
   * @return string
   */
  announceOffline (users?: string[]): string {
    var retVal = 'The following users are out of office:\n';
    var found = false;

    users = users || Object.keys(this.ooo_users);

    for (var x in users) {
      if (this.ooo_users[users[x]]
        && this.ooo_users[users[x]].isOOO()
      ) {
        found = true;
        retVal += `> ${users[x]}: ${this.ooo_users[users[x]].message}\n`;
      }
    }

    return found ? retVal : '';
  }

  /**
   * Handle direct commands
   *
   * @param object channel
   * @param string message
   * @return string
   */
  handleDirectCommand (channel: Object, message: string): string {
    var retVal = '';

    if (message.match(/who/i)) {
      retVal = this.announceOffline();
    }

    return retVal;
  }

  /**
   * Function to be called on slack open
   */
  slackOpen (): void {
    var unreads = this.slack.getUnreadCount();

    var id: string;
    var channels: string[] = [];
    var allChannels = this.slack.channels;
    for (id in allChannels) {
      if (allChannels[id].is_member) {
        channels.push(`#${allChannels[id].name}`);
      }
    }

    var groups: string[] = [];
    var allGroups = this.slack.groups;
    for (id in allGroups) {
      if (allGroups[id].is_open && !allGroups[id].is_archived) {
        groups.push(allGroups[id].name);
      }
    }

    logger.info(`Welcome to Slack. You are @${this.slack.self.name} of ${this.slack.team.name}`);
    logger.info(`You are in: ${channels.join(', ')}`);
    logger.info(`As well as: ${groups.join(', ')}`);
    var messages = unreads === 1 ? 'message' : 'messages';
    logger.info(`You have ${unreads} unread ${messages}`);
  }

  /**
   * Handle an incoming message
   * @param object message The incoming message from Slack
   */
  handleMessage (message: any): void {
    var channel = this.slack.getChannelGroupOrDMByID(message.channel);
    var user = this.slack.getUserByID(message.user);
    var response = '';
    var type:string = message.type, ts:number = message.ts, text:string = message.text;
    var channelName:string = (channel != null ? channel.is_channel : void 0) ? '#' : '';
    channelName = channelName + (channel ? channel.name : 'UNKNOWN_CHANNEL');
    var userName:string = (user != null ? user.name : void 0) != null ? `@${user.name}` : "UNKNOWN_USER";

    if (type === 'message' && (text != null) && (channel != null)) {
      // Channel is a direct message
      if (channel.is_im) {
        logger.info(`${userName} sent DM: ${text}`);

        if (!this.ooo_users[userName]) {
          this.ooo_users[userName] = new OOO_User(userName);
        }

        response = this.ooo_users[userName].handleMessage(text);
        if (response) {
          channel.send(response);
          logger.info(`@${this.slack.self.name} responded to ${userName} with "${response}"`);
        }
      } else {
        // Search message for user mentions
        var matches = text.match(/@\w+/g);
        if (matches) {
          // Need to translate user id to username
          var translatedUsers = [],
            matchedUser;
          for (var x in matches) {
            matchedUser = this.slack.getUserByID(matches[x].replace('@', ''));
            if (matchedUser) {
              translatedUsers.push(`@${matchedUser.name}`);
            }
          }

          if (translatedUsers) {
            // If we are the mentioned user
            if (translatedUsers.indexOf(`@${this.slack.self.name}`) !== -1) {
              response = this.handleDirectCommand(channel, text);
            } else {
              // Get OOO responses for users
              response = this.announceOffline(translatedUsers);
            }

            if (response) {
              channel.send(response);
              logger.info(`@${this.slack.self.name} responded with "${response}"`);
            }
          }
        }
      }
    } else {
      var typeError = type !== 'message' ? `unexpected type ${type}.` : null;
      var textError = text == null ? 'text was undefined.' : null;
      var channelError = channel == null ? 'channel was undefined.' : null;
      var errors = [typeError, textError, channelError].filter(function(element) {
        return element !== null;
      }).join(' ');
      logger.info(`@${this.slack.self.name} could not respond. ${errors}`);
    }
  }

  /**
   * Start the bot
   */
  start (): void {
    var self = this;
    this.slack.on('open', function() {
      self.slackOpen();
    });
    this.slack.on('message', function(message: string) {
      self.handleMessage(message);
    });
    this.slack.on('error', function(error: string) {
      logger.error("Error: %s", error);
    });

    this.slack.login();
  }
}

export = Bot;