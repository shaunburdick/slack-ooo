var config = {
  // App related configuration
  app: {
    // Setup channels and times you would like the bot to announce OoO users
    // Example: To announce every 8am in the #general channel
    // announce: {
    //  channels: [ 'general' ],
    //  times: [ '8:00' ]
    // }
    announce: {
      channels: [], // no need to include #
      times: [] // 24 hours, so 1:00 pm is 13:00
    }
  },
  // Slack related configuraton
  slack: {
    token: 'xoxb-foo', // The token for your slack bot
    autoReconnect: true // if you want the bot to attempt reconnection
  }
};
module.exports = config;
