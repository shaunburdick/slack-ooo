/// <reference path="../typings/tsd.d.ts" />

interface ConfigInterface {
  slack: {
    token: string;
    autoReconnect: boolean;
    autoMark: boolean;
  }
}

export = ConfigInterface;