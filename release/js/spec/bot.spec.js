/// <reference path="../typings/tsd.d.ts" />
var Bot = require('../lib/bot');
var config_dist = require('../config.default.js');
describe('Bot', function () {
    var config;
    beforeEach(function () {
        // reset the configuration
        config = config_dist;
    });
    it('should instantiate and set config', function () {
        var bot = new Bot(config);
        expect(bot.config).toEqual(config);
    });
    describe('Direct Commands', function () {
        var bot;
        beforeEach(function () {
            bot = new Bot(config);
        });
        it('should announce offline users when asked', function () {
            spyOn(bot, 'announceOffline');
            bot.handleDirectCommand({}, '@bot who is offline?');
            expect(bot.announceOffline).toHaveBeenCalled();
        });
    });
});
