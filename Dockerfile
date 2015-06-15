FROM node:latest

MAINTAINER Shaun Burdick <docker@shaunburdick.com>

ENV NODE_ENV=production \
    SLACK_TOKEN=xoxb-foo \
    SLACK_AUTO_RECONNECT=true \
    SLACK_AUTO_MARK=true

ADD . /usr/src/myapp

WORKDIR /usr/src/myapp

RUN ["npm", "install"]

CMD ["npm", "start"]