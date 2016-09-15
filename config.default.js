var config = {
  app: {
    announce: {
      channels: [], // no need to include #
      times: [] // 24 hours
    }
  },
  slack: {
    token: 'xoxb-foo',
    autoReconnect: true
  }
};
module.exports = config;
