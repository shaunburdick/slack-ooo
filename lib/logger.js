'use strict';

const winston = require('winston');

/**
 * Returns a function that will generate a preconfigured instance of winston.
 *
 * @return {function} A preconfigured instance of winston
 */
module.exports = () => {
  const logger = new winston.Logger({
    transports: [
      new (winston.transports.Console)({
        timestamp: true,
        prettyPrint: true,
        handleExceptions: true
      })
    ]
  });
  logger.cli();

  return logger;
};
