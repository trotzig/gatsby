const path = require('path')

const { RemoteBrowserTarget } = require('happo.io')
const happoPluginGatsby = require('happo-plugin-gatsby')

const { HAPPO_API_KEY: apiKey, HAPPO_API_SECRET: apiSecret } = process.env

// Select a few pages we want to include in the Happo test suite. These should
// represent a good slice of the website and showcase as many UI components as
// possible.
const selectedPages = [
  '/contributors/shannon-soper/', // The contributor page
  '/blog/tags/react/', // The tag page
  '/blog/2018-05-31-open-sourcing-gatsby-workshops/', // A blog post
  '/docs/', // The Getting Started page
  '/docs/browser-apis/', // This docs page has lists, sublists, code blocks, etc.
  '/features/', // Lots of graphics on this page
  '/tutorial/part-two/', // A selected tutorial page
  '/', // The start page
  '/plugins/', // The start page for plugins
  '/packages/gatsby-link/', // The plugin page
  '/colors/', // Gatsby colors
  '/showcase/docs.kata.ai/', // A showcase page
  '/404/', // The not found page
]

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
      pageFilter: pagePath =>
        selectedPages.some(
          selectedPage => pagePath === path.join(__dirname, 'public', selectedPage, 'index.html'),
        ),
    }),
  ],
}
