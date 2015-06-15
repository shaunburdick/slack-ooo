import Config = require('./lib/ConfigInterface');

var config: Config = {
  slack: {
    token: 'xoxb-Your-Token', // Your Slack Token
    autoReconnect: true, // Reconnect on disconnect
    autoMark: true // Mark messages as read
  }
};

export = config;