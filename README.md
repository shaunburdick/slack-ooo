Out of Office Bot for Slack
===========================

This bot can be told when you are out of the office. It will then listen to conversations and tell users that mention you that you are not around.

##Usage
To use this bot, you start a conversation with it:
```
Shaun Burdick [4:53 PM]
hi

OOO BotBOT [4:53 PM]
Hello and welcome to Out of Office Bot!
You can ask for help at any time by saying `help`

I don't have you as out of office. Would you like to set yourself Out of Office? [Yes/No]

Shaun Burdick [4:53 PM]
help

OOO BotBOT [4:53 PM]
*Out of Office Bot*

I can keep track of when you are out of the office and tell people that mention you.

*Usage*:
To set yourself out of office, say hello and follow my prompts!
To return to the office once you are back, say hello again!

Shaun Burdick [4:53 PM]
yes

OOO BotBOT [4:53 PM]
Sweet. You are now marked Out of Office with no message.
If you would like to set your Out of Office message, send it to me now

Shaun Burdick [4:53 PM]
In training

OOO BotBOT [4:53 PM]
Setting your OOO Message to:
In training
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
-e JIRA_HOST=foo.bar.com \
-e JIRA_USER=someuser \
-e JIRA_PASS=12345 \
-e SLACK_TOKEN=xobo-blarty-blar-blar \
shaunburdick/slack-ooo:latest
```
