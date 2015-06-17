Out of Office Bot for Slack
===========================

This bot can be told when you are out of the office. It will then listen to conversations and tell users that mention you that you are not around.

##Usage
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

## Install
1. Clone this [repository](https://github.com/shaunburdick/slack-ooo.git)
2. `npm install`
3. Copy `./release/js/config.default.js` to `./release/js/config.js` and fill it out
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

- *SLACK_TOKEN*=xoxb-foo, Your Slack Token
- *SLACK_AUTO_RECONNECT*=true, Reconnect on disconnect
- *SLACK_AUTO_MARK*=true, Mark messages as read

Set them using the `-e` flag while running docker:

```
docker run -it \
-e SLACK_TOKEN=xobo-blarty-blar-blar \
shaunburdick/slack-ooo:latest
```
