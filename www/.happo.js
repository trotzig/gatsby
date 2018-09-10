const path = require('path');

const { RemoteBrowserTarget } = require('happo.io');
const happoPluginGatsby = require('happo-plugin-gatsby');

const {
  HAPPO_API_KEY: apiKey,
  HAPPO_API_SECRET: apiSecret,
} = process.env;

const seenDirs = new Set();

module.exports = {
  apiKey,
  apiSecret,
  targets: {
    'chrome-large': new RemoteBrowserTarget('chrome', {
      viewport: '800x600',
    }),
    'chrome-small': new RemoteBrowserTarget('chrome', {
      viewport: '320x640',
    }),
  },
  plugins: [
    happoPluginGatsby({
      pageFilter: (pagePath) => {
        const dir = path.dirname(path.dirname(pagePath));
        if (seenDirs.has(dir)) {
          // prevent "duplicate" pages, e.g.
          // packages/gatsby-plugin-baidu-analytics/index.html and
          // packages/gatsby-plugin-antd-mobile/index.html
          return false;
        }
        seenDirs.add(dir);
        return true;
      },
    }),
  ],
};
