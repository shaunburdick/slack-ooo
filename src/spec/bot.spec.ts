/// <reference path="../typings/tsd.d.ts" />

import Bot = require('../lib/bot');
import Config = require('../lib/ConfigInterface');
var config_dist: Config = require('../config.default.js');

describe ('Bot', () => {
  var config: Config;

  beforeEach(() => {
    // reset the configuration
    config = config_dist;
  });

  it ('should instantiate and set config', () => {
    var bot = new Bot(config);
    expect(bot.config).toEqual(config);
  });
});