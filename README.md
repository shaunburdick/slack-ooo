Out of Office Bot for Slack
===========================

[![Build Status](https://travis-ci.org/shaunburdick/slack-ooo.svg?branch=master)](https://travis-ci.org/shaunburdick/slack-ooo) [![Docker Pulls](https://img.shields.io/docker/pulls/shaunburdick/slack-ooo.svg?maxAge=2592000)](https://hub.docker.com/r/shaunburdick/slack-ooo/)
[![Coverage Status](https://coveralls.io/repos/github/shaunburdick/slack-ooo/badge.svg)](https://coveralls.io/github/shaunburdick/slack-ooo) [![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-round)](https://github.com/Flet/semistandard)

[![Deploy to Docker Cloud](https://files.cloud.docker.com/images/deploy-to-dockercloud.svg)](https://cloud.docker.com/stack/deploy/?repo=https://github.com/shaunburdick/slack-ooo) [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

This bot can be told when you are out of the office. It will then listen to conversations and tell users that mention you that you are not around.

**If you want a personal OoO bot that acts as you, check out [shaunburdick/slack-ooo-personal](https://github.com/shaunburdick/slack-ooo-personal)!**

## Features
- Users set themselve out of the office by talking to the bot
- When a user that is set out of office is mentioned in a channel the bot is in, it will send a message to that channel that the user if out of the office and display their out of office message
- The bot can be configured to announce out of office users to specific channels on specific times (bot must be in that channel to make the announcement)

## Usage
To use this bot, you start a conversation with it:

```
Shaun Burdick [5:29 PM]
hi

OOO BotBOT [5:29 PM]
Hello and welcome to Out of Office Bot!
You can ask for help at any time by saying `help`

I don't have you as out of office. Would you like to set yourself Out of Office? [Yes/No]

Shaun Burdick [5:29 PM]
help

OOO BotBOT [5:29 PM]
*Out of Office Bot*

I can keep track of when you are out of the office and tell people that mention you.

*Usage*:
To set yourself out of office, say hello and follow my prompts!
To return to the office once you are back, say hello again!

*Direct Commands:*
- message: _string_, To set your Out of Office message
          Example: `message: I am out of the office`
- start:   _string_, A parsable date/time string when your Out of Office begins
          Example: `start: 2015-06-06 8:00`
- end:     _string_, A parsable date/time string when your Out of Office ends
          Example: `end: 2015-06-06 16:00`

Shaun Burdick [5:29 PM]
ok, start: tomorrow end: next monday at 8am message: I will be out until next week

OOO BotBOT [5:29 PM]
-You will be marked Out of Office at Tomorrow at 12:00 PM
-You are marked Out of Office returning on Monday at 8:00 AM
-Setting your OOO Message to:
I will be out until next week
```

## Announcements
The bot can announce which users are out of office on a schedule. To enable this feature, you need to provide the bot with a list of channels to make the announcement and at what times (local to bot).
- **app.announce.channels**: this is an array of channel names to announce to
  - The bot *must* be a member of the channel in order to make the announcements
  - channels names *must* not contain the starting `#`
- **app.announce.times**: this is an array of times each day to make the announcement
  - Each time will be considered as 24-hour time, (ie `13:00` is 1:00 pm)

## Install
1. Clone this [repository](https://github.com/shaunburdick/slack-ooo.git)
2. `npm install`
3. Copy `./config.default.js` to `./config.js` (the same root directory) and fill it out
4. `npm start`

## Test
1. `npm install` (make sure your NODE_ENV != `production`)
2. `npm test`

## Docker

Build an image using `docker build -t your_image:tag`

Official Image [shaunburdick/slack-ooo](https://registry.hub.docker.com/u/shaunburdick/slack-ooo/)

### Configuration Environment Variables
You can set the configuration of the bot by using environment variables.
*ENVIRONMENT_VARIABLE*=Default Value

- *APP_ANNOUNCE_CHANNELS*=general,random, A list of channels to announce OoO on
- *APP_ANNOUNCE_TIMES*=08:00,16:00, A list of times to announce OoO users
- *SLACK_TOKEN*=xoxb-foo, Your Slack Token
- *SLACK_AUTO_RECONNECT*=true, Reconnect on disconnect

Set them using the `-e` flag while running docker:

```
docker run -it \
-e SLACK_TOKEN=xobo-blarty-blar-blar \
shaunburdick/slack-ooo:latest
```

## Contributing
1. Create a new branch, please don't work in master directly.
2. Add failing tests for the change you want to make (if appliciable). Run `npm test` to see the tests fail.
3. Fix stuff.
4. Run `npm test` to see if the tests pass. Repeat steps 2-4 until done.
5. Update the documentation to reflect any changes.
6. Push to your fork and submit a pull request.
