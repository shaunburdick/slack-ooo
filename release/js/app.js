/// <reference path="./typings/tsd.d.ts" />
var logger = require('./lib/logger');
var Bot = require('./lib/bot');
var config = (function () {
    var retVal;
    try {
        retVal = require('./config');
    }
    catch (e) {
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
