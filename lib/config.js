'use strict';

/**
 * Parse a boolean from a string
 *
 * @param  {string} string A string to parse into a boolean
 * @return {mixed}         Either a boolean or the original value
 */
function parseBool (string) {
  if (typeof string === 'string') {
    return /^(true|1)$/i.test(string);
  }

  return string;
}

/**
 * Parse a comma separated list into an array of terms
 *
 * @param  {string}   list A comma separated list
 * @return {string[]} an array of parsed terms
 */
function parseList (list) {
  return (list || '').replace(/^\s+|\s+$/, '').split(/\s*,\s*/);
}

/**
 * Parses and enhances config object
 *
 * @param  {object} cfg the raw object from file
 * @return {object}     the paresed config object
 * @throws Error if it cannot parse object
 */
function parse (cfg) {
  if (typeof cfg !== 'object') {
    throw new Error('Config is not an object');
  }

  const config = cfg;

  /**
   * Pull config from ENV if set
   */
  config.app.announce.channels = parseList(process.env.APP_ANNOUNCE_CHANNELS) || [];
  config.app.announce.times = parseList(process.env.APP_ANNOUNCE_TIMES) || [];

  config.slack.token = process.env.SLACK_TOKEN || config.slack.token;
  config.slack.autoReconnect = parseBool(process.env.SLACK_AUTO_RECONNECT) ||
    config.slack.autoReconnect;

  return config;
}

module.exports = {
  parse,
  parseBool,
  parseList
};
