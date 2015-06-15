/// <reference path="./typings/tsd.d.ts" />

import Config = require('./lib/ConfigInterface');
import logger = require('./lib/logger');
import Bot = require('./lib/bot');

var config: Config = (function() {
  var retVal: Config;

  try { // local config first
    retVal = require('./config');
  } catch (e) { // default config
    retVal = require('./config.default');
  }

  return retVal;
}());

/**
 * Pull config from ENV if set
 */
config.slack.token = process.env.SLACK_TOKEN || config.slack.token;
config.slack.autoReconnect = process.env.SLACK_AUTO_RECONNECT || config.slack.autoReconnect;
config.slack.autoMark = process.env.SLACK_AUTO_MARK || config.slack.autoMark;

logger.info("Using the following configuration:", config);

var bot = new Bot(config);

bot.start();