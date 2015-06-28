/// <reference path="../typings/tsd.d.ts" />
var winston = require('winston');
/**
 * Logger bootstrap.
 *
 * @module Logger
 */
var logger = new winston.Logger({
    transports: [
        new (winston.transports.Console)({
            timestamp: true,
            prettyPrint: true,
            handleExceptions: true
        })
    ]
});
logger.cli();
module.exports = logger;
