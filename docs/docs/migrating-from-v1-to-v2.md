---
title: Migrating from v1 to v2
---

> This document is a work in progress. Have you upgraded your site and run into something that's not covered here? [Add your changes on GitHub](https://github.com/gatsbyjs/gatsby/edit/master/docs/docs/migrating-from-v1-to-v2.md)!

## Introduction

This is a reference for upgrading your site from Gatsby v1 to Gatsby v2. While there's a lot covered here, you probably won't need to do everything for your site. We'll do our best to keep things easy to follow, and as sequential as possible so you can quickly get rocking on v2!

> If you want to start fresh, check out the [starting a new project section](#for-explorers)

## What we'll cover

- [Updating Your Dependencies](#updating-your-dependencies)

  - [Update Gatsby version](#update-gatsby-version)
  - [Manually install React](#manually-install-react)
  - [Manually install plugins’ peer dependencies](#manually-install-plugins'-peer-dependencies)

- [Handling Breaking Changes](#handling-breaking-changes)

  - [Remove or refactor layout components](#remove-or-refactor-layout-components)
  - [Change `navigateTo` to `navigate`](#change-navigateto-to-navigate)
  - [Convert to either pure CommonJS or pure ES6](#convert-to-either-pure-commonjs-or-pure-es6)
  - [Move Babel configuration](#move-babel-configuration)
  - [Restore v1 PostCSS plugin setup](#restore-v1-postcss-plugin-setup)
  - [Migrate from React Router` to @reach/router](#migrate-from-react-router-to-reachrouter)
  - [APIs onPreRouteUpdate and onRouteUpdate no longer called with the route update action](#apis-onprerouteupdate-and-onrouteupdate-no-longer-called-with-the-route-update-action)
  - [Browser API `replaceRouterComponent` was removed](#browser-api-replaceroutercomponent-was-removed)
  - [Browser API `replaceHistory` was removed](#browser-api-replacehistory-was-removed)
  - [Browser API `wrapRootComponent` was replaced with `wrapRootElement`](#browser-api-wraprootcomponent-was-replaced-with-wraprootelement)
  - [Don't query nodes by ID](#dont-query-nodes-by-id)
  - [Use Query in place of RootQueryType](#use-query-in-place-of-rootquerytype)
  - [Typography.js Plugin Config](#typographyjs-plugin-config-changes)
  - [Update CSS Modules class names that use dashes](#update-css-modules-class-names-that-use-dashes)

- [Resolving Deprecations](#resolving-deprecations)

  - [Import Link from Gatsby](#import-link-from-gatsby)
  - [Import graphql from Gatsby](#import-graphql-from-gatsby)
  - [Rename `boundActionCreators` to `actions`](#rename-boundactioncreators-to-actions)
  - [Rename `pathContext` to `pageContext`](#rename-pathcontext-to-pagecontext)
  - [Rename responsive image queries](#rename-responsive-image-queries)
  - [`deleteNodes` API deprecated](#delete-nodes-api-deprecated)

- [Other Changes Worth Noting](#other-changes-worth-noting)

  - [Explicit query names no longer required](#explicit-query-names-no-longer-required)
  - [Remove inlined CSS in `html.js`](#remove-inlined-css-in-htmljs)
  - [Remove explicit polyfills](#remove-explicit-polyfills)

- [For Plugin Maintainers](#for-plugin-maintainers)

  - [Setting the proper Peer Dependencies](#setting-the-proper-peer-dependencies)
  - [Change `modifyBabelrc` to `onCreateBabelConfig`](#change-modifybabelrc-to-oncreatebabelconfig)
  - [Change `modifyWebpackConfig` to `onCreateWebpackConfig`](#change-modifywebpackconfig-to-oncreatewebpackconfig)
  - [`createRemoteFileNode` API has changed](#createRemoteFileNode)
  - [Only allow defined keys on the `node.internal` object](#only-allow-defined-keys-on-the-node-internal-object)
  - [Import `graphql` types from `gatsby/graphql`](#import-graphql-types-from-gatsbygraphql)

- [For Explorers](#for-explorers)
  - [V2 from Scratch](#starting-a-new-project-with-gatsby-v2)

## Updating Your Dependencies

The very first thing you will need to do is update your dependencies and install any needed peer dependencies.

### Update Gatsby version

Since v2 is currently in beta, you need update your `package.json` to use the pre-release versions of Gatsby.

`package.json`

```json
"dependencies": {
  "gatsby": "next",
  "gatsby-image": "next",
  "gatsby-plugin-sharp": "next"
}
```

> Note: Gatsby v2 is in pre-release so you may encounter further breaking changes.

### Update Gatsby related packages

Update your `package.json` to use the pre-release versions of Gatsby related packages. Any package name that starts with `gatsby-` should be upgraded to use the `next` version. Note, this only applies to plugins managed in the gatsbyjs/gatsby repo. If you're using community plugins, they might not be upgraded yet. Check their repo for the status. Many plugins won't actually need upgrading so they very well might keep working. For example:

`package.json`

```json
"dependencies": {
    "gatsby-plugin-google-analytics": "next",
    "gatsby-plugin-netlify": "next",
    "gatsby-plugin-sass": "next",
}
```

### Manually install React

In v1, the `react` and `react-dom` packages were included as part of the `gatsby` package. They are now `peerDependencies` so you are required to install them into your project.

```bash
npm i react react-dom
```

### Manually install plugins' peer dependencies

Some plugins had dependencies that were also made `peerDependencies`. For example, if you use [`gatsby-plugin-typography`](https://www.gatsbyjs.org/packages/gatsby-plugin-typography/), you now need to install:

```bash
npm i typography react-typography
```

Search for the plugins that you use in the [plugin library](/plugins) and check their installation instructions for additional packages that now need installed.

## Handling Breaking Changes

### Remove or refactor layout components

In Gatsby v2, the special layout component (`src/layouts/index.js`) that wrapped every page in Gatsby v1 has been removed. The "top level component" is now just the page itself. If the layout of your site looks broken, this is likely the reason why.

There are a number of implications to this change:

- To render different layouts for different pages, just use the standard React inheritance model. Gatsby no longer maintains, or needs to maintain, separate behavior for handling layouts.
- Because the "top level component" changes between each page, React will rerender all children. This means that shared components previously in a Gatsby v1 layout-- like navigations-- will unmount and remount. This will break CSS transitions or React state within those shared components. If your use case requires layout component to not unmount use [`gatsby-plugin-layout`](https://www.gatsbyjs.org/packages/gatsby-plugin-layout/).

- To learn more about the original decisions behind this removal, read the [RFC for removing the special layout component](https://github.com/gatsbyjs/rfcs/blob/master/text/0002-remove-special-layout-components.md).

The following migration path is recommended:

#### 1. Convert the layout's children from a render prop to a normal prop (required)

In v1, the `children` prop passed to layout was a function (render prop) and needed to be executed. In v2, this is no longer the case.

```diff
import React from "react"

export default ({ children }) => (
  <div>
-    {children()}
+    {children}
  </div>
)
```

#### 2. Move `layouts/index.js` to `src/components/layout.js` (optional, but recommended)

```bash
git mv src/layouts/index.js src/components/layout.js
```

#### 3. Import and wrap pages with the layout component

Adhering to the normal React composition model, import your layout component and use it to wrap the content of the page.

`src/pages/index.js`

```jsx
import React from "react"
import Layout from "../components/layout"

export default () => (
  <Layout>
    <div>Hello World</div>
  </Layout>
)
```

Repeat for every page and template that needs this layout.

#### 4. Pass `history`, `location`, and `match` props to layout

In v1, the layout component had access to `history`, `location`, and `match` props. In v2, only pages have access to these props; if you need these props in the layout component, pass them through from the page.

`layout.js`

```jsx
import React from "react"

export default ({ children, location }) => (
  <div>
    <p>Path is {location.pathname}</p>
    {children}
  </div>
)
```

`src/pages/index.js`

```jsx
import React from "react"
import Layout from "../components/layout.js"

export default props => (
  <Layout location={props.location}>
    <div>Hello World</div>
  </Layout>
)
```

#### 5. Change query to use `StaticQuery`

If you were using the `data` prop in your Gatsby v1 layout, you now need to make use of Gatsby v2’s [StaticQuery feature](/docs/static-query/), since a layout is now a normal component.

Replacing a layout's query with `StaticQuery`:

`layout.js`

```diff
import React, { Fragment } from "react"
import Helmet from "react-helmet"
+ import { StaticQuery, graphql } from "gatsby"

- export default ({ children, data }) => (
-   <>
-     <Helmet titleTemplate={`%s | ${data.site.siteMetadata.title}`} defaultTitle={data.site.siteMetadata.title} />
-     <div>
-       {children()}
-     </div>
-   </>
- )
-
- export const query = graphql`
-   query LayoutQuery {
-     site {
-       siteMetadata {
-         title
-       }
-     }
-   }
- `
+ export default ({ children }) => (
+   <StaticQuery
+     query={graphql`
+       query LayoutQuery {
+         site {
+           siteMetadata {
+             title
+           }
+         }
+       }
+     `}
+     render={data => (
+       <>
+         <Helmet titleTemplate={`%s | ${data.site.siteMetadata.title}`} defaultTitle={data.site.siteMetadata.title} />
+         <div>
+           {children}
+         </div>
+       </>
+     )}
+   />
+ )
```

### Change `navigateTo` to `navigate`

The `navigateTo` method in `gatsby-link` was renamed to `navigate` to mirror
the [API used by @reach/router](https://reach.tech/router/api/navigate).

In addition to the name change, `gatsby-link` is now directly exported from the `gatsby` package and can't be installed directly.

```diff
import React from "react"
- import { navigateTo } from "gatsby-link"
+ import { navigate } from "gatsby"

// Don't use navigate with an onClick btw :-)
// Generally just use the `<Link>` component.
export default props => (
-  <div onClick={() => navigateTo(`/`)}>Click to go to home</div>
+  <div onClick={() => navigate(`/`)}>Click to go to home</div>
)
```

### Convert to either pure CommonJS or pure ES6

Gatsby v2 uses webpack 4 which is stricter about modules with mixed module systems.

All ES6 is 👍:

```js
// GOOD: ES modules syntax works
import foo from "foo"
export default foo
```

All CommonJS is 👌:

```js
// GOOD: CommonJS syntax works
const foo = require("foo")
module.exports = foo
```

Mixing `requires` and `export` is 🙀:

```js
// BAD: Mixed ES and CommonJS module syntax will cause failures
const foo = require("foo")
export default foo
```

Mixing `import` and `module.exports` 🤪:

```js
// BAD: Mixed ES and CommonJS module syntax will cause failures
import foo from "foo"
module.exports = foo
```

### Move Babel Configuration

The latest version of Gatsby uses Babel 7, which introduced [a new behavior for configuration lookup / resolution](https://github.com/babel/babel/issues/6766). In the case where a _.babelrc_ file might have been used at the root of the project, like for configuring Jest, moving that Babel configuration into _jest.config.json_ will avoid any conflicts.

[This GitHub comment](https://github.com/facebook/jest/issues/1468#issuecomment-361260279) documents the steps needed to do that.

More information on Gatsby and Babel configuration available [here](/docs/babel/#how-to-use-a-custom-babelrc-file).

### Restore v1 PostCSS Plugin Setup

Gatsby v2 removed `postcss-cssnext` and `postcss-import` from the default PostCSS setup.

To have the same configuration that you had in v1 (if you were using these plugins), you should use [`gatsby-plugin-postcss`](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-plugin-postcss) and follow the recommended migration path below.

#### 1. Install the dependencies

`npm install --save gatsby-plugin-postcss postcss-import postcss-cssnext postcss-browser-reporter postcss-reporter`

**NOTE**: `postcss-cssnext` is [deprecated](https://moox.io/blog/deprecating-cssnext/) and it is better to use `postcss-preset-env` now.

#### 2. Include `gatsby-plugin-postcss` in your `gatsby-config.js` file

```js
// in gatsby-config.js
plugins: [`gatsby-plugin-postcss`],
```

#### 3. Include PostCSS plugins in your `postcss.config.js` file

```js
// in postcss.config.js
const postcssImport = require(`postcss-import`)
const postcssCssNext = require(`postcss-cssnext`)
const postcssBrowserReporter = require(`postcss-browser-reporter`)
const postcssReporter = require(`postcss-reporter`)

module.exports = () => ({
  plugins: [
    postcssImport(),
    postcssCssNext(),
    postcssBrowserReporter(),
    postcssReporter(),
  ],
})
```

### Migrate from React Router to @reach/router

We switched our router from [React Router v4](https://reacttraining.com/react-router/) to [@reach/router](https://reach.tech/router) as @reach/router is smaller and most importantly, has 1st class support
for accessibility.

@reach/router is written by [Ryan Florence](https://twitter.com/ryanflorence), who was also the founder of React Router. He says @reach/router restores
things he misses from React Router v3 while retaining the best parts of React Router v4 _and_ adds full accessibility support.

For _most_ sites, this change won't cause any breaking changes as the two routers are quite similar.

Two common ways this change _might_ break your site is:

- You use the object form of the `to` prop in the `<Link>` component
- You have client side routes

Read more about the features of our new router at https://reach.tech/router

**NOTE:** One prominant feature of @reach/router, relative routes, isn't working currently in Gatsby. We're working with Ryan Florence
on fixing that so hopefully it'll be supported soon.

Read on for instructions on migrating your site to @reach/router.

#### Only string `to` allowed

React Router allowed you to pass objects to the `to` prop e.g.

```jsx
<Link
  to={{ pathname: `/about/`, search: `fun=true&pizza=false`, hash: `people` }}
>
  Our people
</Link>
```

React Router would then simply concatenate the object values together into the full pathname e.g. `/about/?fun=true&pizza=false#people`.

Now you'll need to concatenate together the full pathname yourself.

```diff
- <Link to={{ pathname: `/about/`, search: `fun=true&pizza=false`, hash: `people`}}>Our people</Link>
+ <Link to={`/about/?fun=true&pizza=false#people`}>Our people</Link>
```

#### Pass state to the `state` prop

Previously with React Router to pass state to a link, you would pass it as part of a `to` object prop.

Now, to add state to a link, pass it via a `state` prop.

```jsx
const NewsFeed = () => (
  <div>
    <Link to="photos/123" state={{ fromNewsFeed: true }} />
  </div>
)

const Photo = ({ location, photoId }) => {
  if (location.state.fromFeed) {
    return <FromFeedPhoto id={photoId} />
  } else {
    return <Photo id={photoId} />
  }
}
```

#### A `history` prop is no longer passed to page components

React Router would pass a `history` prop to components that you could use to navigate.

If you need to do programmatic navigation, import instead the @reach/router's `navigate` function.

```javascript
import { navigate } from "@reach/router"
```

#### The following props are no longer available on `<Link>`

- `exact`
- `strict`
- `location`

`exact` and `strict` are no longer necessary as @reach/router does matching
this way by default.

You could pass `location` previously to manually compute whether the
link is active or not. For advanced link stylings, use `getProps` now.

#### Use `getProps` for advanced link styling

Gatsby's `<Link>` component supports out-of-the-box `activeClassName` and `activeStyle`.

If you have more advanced styling needs, [use the `getProps` prop](https://reach.tech/router/api/Link).

#### Change client paths to use a splat

When creating a client route in `gatsby-node.js`, use a `*` to select all child routes instead of `:path`.

```diff
exports.onCreatePage = async ({ page, actions }) => {
  const { createPage } = actions

  // page.matchPath is a special key that's used for matching pages
  // only on the client.
  if (page.path.match(/^\/app/)) {
-    page.matchPath = "/app/:path"
+    page.matchPath = "/app/*"

    // Update the page.
    createPage(page)
  }
}
```

#### Migrating React Router client routes to @reach/router

- Use `<Location>` instead of `withRouter`
- import `{ navigate }` from `@reach/router` for programmatic navigation instead of the history object
- There's no `Route` component any more. You add a `<Router>` component (a site can have as many routers as it wishes) and then the immediate children of `<Router>` must have a prop named `path`.

A basic example of the `<Router>` component:

```jsx
import React from "react"
import { Router } from "@reach/router"

export default () => (
  <Router>
    <div path="/">I am the home!</div>
    <div path="/about">Here's a bit about me</div>
    <div path="/store">Buy my t-shirts!</div>
  </Router>
)
```

Here's a more complex example of migrating a `<PrivateRoute>` component (used
in store.gatsbyjs.org) from React Router to @reach/router.

```diff
 import React from 'react';
-import { Redirect, Route } from 'react-router-dom';
+import { Router, navigate } from '@reach/router';
 import { isAuthenticated } from '../../utils/auth';

-export default ({ component: Component, ...rest }) => (
-  <Route
-    {...rest}
-    render={props =>
-      !isAuthenticated() ? (
-        // If we’re not logged in, redirect to the home page.
-        <Redirect to={{ pathname: '/login' }} />
-      ) : (
-        <Component {...props} />
-      )
-    }
-  />
-);
+export default ({ component: Component, ...rest }) => {
+  if (!isAuthenticated() && window.location.pathname !== `/login`) {
+    // If we’re not logged in, redirect to the home page.
+    navigate(`/app/login`);
+    return null;
+  }
+
+  return (
+    <Router>
+      <Component {...rest} />
+    </Router>
+  );
+};
```

Here's links to diffs for three sites with client routes that were upgraded to @reach/router

- [store.gatsbyjs.org](https://github.com/gatsbyjs/store.gatsbyjs.org/pull/111)
- [client-only-routes](https://github.com/gatsbyjs/gatsby/pull/6918/files#diff-69757e54875e28ef83eb8efe45a33fdf)
- [simple-auth](https://github.com/gatsbyjs/gatsby/pull/6918/files#diff-53ac112a4b2ec760b26a86c953df2339)

### APIs `onPreRouteUpdate` and `onRouteUpdate` no longer called with the route update action

React Router v4 would tell us the "action" (push/replace) that triggered the route
transition. We passed this as one of the arguments along with `location` to plugins. @reach/router doesn't support this so we've removed it from the API calls.

### Browser API `replaceRouterComponent` was removed

React Router allowed you to swap out its history object. To enable this in Gatsby, an API, `replaceRouterComponent` was added so that you could use a custom version of history or React Router. As @reach/router doesn't support this, we've removed this API.

We did, erroneously, suggest using this API for adding support for Redux, etc. where you need to wrap the root Gatsby component with your own component.

If you were using `replaceRouterComponent` for this, you'll need to migrate to
`wrapRootElement`:

```diff
import React from 'react'
import { Provider } from 'react-redux'
-import { Router } from 'react-router-dom'

-export const replaceRouterComponent = ({ history }) => {
+export const wrapRootElement = ({ element }) => {
-  const ConnectedRouterWrapper = ({ children }) => (
+  const ConnectedRootElement = (
    <Provider store={store}>
-      <Router history={history}>{children}</Router>
+      {element}
    </Provider>
  )

-  return ConnectedRouterWrapper
+  return ConnectedRootElement
}
```

### Browser API `replaceHistory` was removed

Similar to `replaceRouterComponent`, we no longer support custom histories so this was removed.

### Browser API `wrapRootComponent` was replaced with `wrapRootElement`

Use new [`wrapRootElement`](/docs/browser-apis/#wrapRootComponent) API:
We now pass `component` Element instead of `Root` Component and expect that `wrapRootElement` will return Element and not Component. This change was needed to keep all wrapping APIs uniform.

```diff
-export const wrapRootComponent = ({ Root }) => {
+export const wrapRootElement = ({ element }) => {
-  const ConnectedRootComponent = () => (
+  const ConnectedRootElement = (
    <Provider store={store}>
-      <Root />
+      {element}
    </Provider>
  )
-  return ConnectedRootComponent
+  return ConnectedRootElement
}
```

### Don't query nodes by ID

Source and transformer plugins now use UUIDs for IDs. If you used glob or regex to query nodes by id then you'll need to query something else.

Here's an example querying an image:

```diff
  query MyImageQuery {
    allImageSharp(filter: {
-     id: {regex: "/default.jpg/"}
+     fluid: {originalName: {regex: "/default.jpg/"}}
    }) {
      edges {
        node {
          id
          fluid(maxWidth: 660) {
            src
          }
        }
      }
    }
  }
```

[See the Pull Request that implemented this change](https://github.com/gatsbyjs/gatsby/pull/3807/files)

### Use `Query` in place of `RootQueryType`

The GraphQL root type has been changed from `RootQueryType` to `Query`. This is only likely to impact you if you have top-level fragments in your GraphQL queries:

```diff
  query Blog {
    ...Sidebar
    blogPosts {
      title
      slug
    }
  }

- fragment Sidebar on RootQueryType {
+ fragment Sidebar on Query {
    siteDescription
  }
}
```

### Typography.js Plugin Config Changes

If you use [`gatsby-plugin-typography`](https://www.gatsbyjs.org/packages/gatsby-plugin-typography/), you now need to explicitly export `scale` and `rhythm` as named exports from your typography config module.

`src/utils/typography.js`

```diff
- const typography = new Typography();
- export default typography;

+ const typography = new Typography();
+ const { rhythm, scale } = typography;
+ export { rhythm, scale, typography as default };
```

### Update CSS Modules class names that use dashes

If you use CSS Modules and have class names with dashes in them, you'll need to change how you access the class names from JavaScript.

This is because the [`camelCase` option](https://github.com/webpack-contrib/css-loader#camelcase) for CSS Modules has been changed from `false` to `dashesOnly`.

Here's an example with a class named `.my-class-name`:

```diff
import React from "react"
import myStyles from "./my.module.css"

export default ({ children }) => (
-  <div className={myStyles['my-class-name']}>
+  <div className={myStyles.myClassName}>
    {children}
  </div>
)
```

TODO: add a code snippet that uses [`onCreateWebpackConfig`](/docs/node-apis/#onCreateWebpackConfig) to revert to Gatsby's v1 behaviour.

## Resolving Deprecations

### Import Link from Gatsby

All components and utility functions from `gatsby-link` are now exported from `gatsby` package. Therefore you should import it directly from `gatsby`.

```diff
import React from "react"
- import Link from "gatsby-link"
+ import { Link } from "gatsby"

export default props => (
  <Link to="/">Home</Link>
)
```

Furthermore you can remove the package from the `package.json`.

```diff
"dependencies": {
  "gatsby": "next",
  "gatsby-image": "next",
  "gatsby-plugin-sharp": "next",
- "gatsby-link": "^1.6.39"
}
```

### Import graphql from Gatsby

The `graphql` tag function that Gatsby v1 auto-supports is deprecated in v2. Gatsby will throw deprecation warning unless you explicitly import it from the `gatsby` package.

```diff
import React from "react"
+ import { graphql } from "gatsby"

export default ({ data }) => (
  <h1>{data.site.siteMetadata.title}</h1>
)

export const query = graphql`
  query HomeQuery {
    site {
      siteMetadata {
        title
      }
    }
  }
`
```

> There is a codemod that can automatically make this change to your projects. Check out the [`gatsby-codemods`](https://www.npmjs.com/package/gatsby-codemods) package for usage instructions.

### Rename `boundActionCreators` to `actions`

`boundActionCreators` is deprecated in v2. You can continue using it, but it’s recommended that you rename it to `actions`.

> TODO: document new actions - see [actions](/docs/actions)

### Rename `pathContext` to `pageContext`

Similar to `boundActionCreators` above, `pathContext` is deprecated in favor of `pageContext`.

### Rename responsive image queries

The `sizes` and `resolutions` queries are deprecated in v2. These queries have been renamed to `fluid` and `fixed` to make them easier to understand. You can continue using the deprecated query names, but it's recommended that you update them.

Update image query and fragment names:

```diff
import React from "react"
import { graphql } from "gatsby"

const Example = ({ data }) => {
  <div>
-    <Img sizes={data.foo.childImageSharp.sizes} />
-    <Img resolutions={data.bar.childImageSharp.resolutions} />
+    <Img fluid={data.foo.childImageSharp.fluid} />
+    <Img fixed={data.bar.childImageSharp.fixed} />
  </div>
}

export default Example

export const pageQuery = graphql`
  query IndexQuery {
    foo: file(relativePath: { regex: "/foo.jpg/" }) {
      childImageSharp {
-        sizes(maxWidth: 700) {
-          ...GatsbyImageSharpSizes_tracedSVG
+        fluid(maxWidth: 700) {
+          ...GatsbyImageSharpFluid_tracedSVG
        }
      }
    }
    bar: file(relativePath: { regex: "/bar.jpg/" }) {
      childImageSharp {
-        resolutions(width: 500) {
-          ...GatsbyImageSharpResolutions_withWebp
+        fixed(width: 500) {
+          ...GatsbyImageSharpFixed_withWebp
        }
      }
    }
  }
`
```

Further examples can be found in the [Gatsby Image docs](https://github.com/gatsbyjs/gatsby/tree/d0e29272ed7b009dae18d35d41a45e700cdcab0d/packages/gatsby-image).

### Delete Nodes API Deprecated

`deleteNodes` is now deprecated, so instead you should write `nodes.forEach(n => deleteNode({ node: n }))`

## Other Changes Worth Noting

### Explicit query names no longer required

Gatsby v2 doesn't require explicit query names. You can skip them now:

```diff
export const query = graphql`
-  query ThisIsExplicitQueryName($slug: String!) {
+  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
      }
    }
  }
```

You can also skip the `query` keyword if you don't use query variables:

```diff
export const query = graphql`
-  query ThisIsAnotherExplicitQueryName {
+  {
    site {
      siteMetadata {
        title
      }
    }
  }
```

This isn't a breaking change. Queries with explicit names will continue to work as they did in v1.

### Remove inlined CSS in `html.js`

Gatsby v2 will automatically inline your CSS. You can remove any custom CSS inlining from your custom `html.js` and unless it was used for anything else specifically, you can also remove `html.js` itself.

See an example in [this PR that upgrades the `using-remark` site to Gatsby v2](https://github.com/gatsbyjs/gatsby/commit/765b679cbc222fd5f527690427ee431cca7ccd61#diff-637c76e3c059ed8efacedf6e30de2d61).

### Remove explicit polyfills

If your Gatsby v1 site included any polyfills, you can remove them. Gatsby v2 ships with babel 7 and is configured to automatically include polyfills for your code. See [Gatsby's babel docs for more details](/docs/babel).

> Note: This works for your own code, but is not yet implemented for code imported from `node_modules`. Track progress of this feature at [bullet 5 of this issue](https://github.com/gatsbyjs/gatsby/issues/3870).

## For Plugin Maintainers

In most cases you won't have to do anything to be v2 compatible, however there are a few things you can do to be certain your plugin will work well with v2 sites.

### Setting the Proper Peer Dependencies

`gatsby` should be included under `peerDependencies` of your plugin and it should specify the proper versions of support.

```json
"peerDependencies": {
  "gatsby": ">=1"
}
```

### Change `modifyBabelrc` to `onCreateBabelConfig`

`modifyBabelrc` was renamed to [`onCreateBabelConfig`](/docs/node-apis/#modifyBabelrc) to bring it in line with the rest of Gatsby's API names.

Use `onCreateBabelConfig`:

```diff
- exports.modifyBabelrc = ({ babelrc }) => {
-   return {
-     ...babelrc,
-     plugins: babelrc.plugins.concat([`foo`]),
-   }
+ exports.onCreateBabelConfig = ({ actions }) => {
+   actions.setBabelPlugin({
+     name: `babel-plugin-foo`,
+   })
}
```

Note usage of the new [`setBabelPlugin` action](/docs/actions/#setBabelPlugins).

See [Gatsby's babel docs for more details](/docs/babel) about configuring babel.

### Change `modifyWebpackConfig` to `onCreateWebpackConfig`

`modifyWebpackConfig` was renamed to [`onCreateWebpackConfig`](/docs/node-apis/#onCreateWebpackConfig) to bring it in line with the rest of Gatsby's API names.

Use `onCreateWebpackConfig`:

```diff
- exports.modifyWebpackConfig = ({ config, stage }) => {
+ exports.onCreateWebpackConfig = ({ stage, actions }) => {
  switch (stage) {
    case `build-javascript`:
-       config.plugin(`Foo`, webpackFooPlugin, null)
-       break
-   }
-   return config
+       actions.setWebpackConfig({
+         plugins: [webpackFooPlugin],
+       })
+   }
}
```

Note usage of the new [`setWebpackConfig` action](/docs/actions/#setWebpackConfig).

See [Gatsby's webpack docs for more details](/docs/add-custom-webpack-config) about configuring webpack.

### createRemoteFileNode

The signature for using createRemoteFileNode changed in v2, it now expects a new parameter `createNodeId`.

[See docs for `createRemoteFileNode`](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-source-filesystem#createremotefilenode)

### Only allow defined keys on the node internal object

The node internal object isn't meant for adding node data. Those should be added to the top-level object. We
didn't document this in v1 nor validate against it but are now for v2.

### Import `graphql` types from `gatsby/graphql`

Import graphql types from `gatsby/graphql` to prevent `Schema must contain unique named types but contains multiple types named "<typename>"` errors. `gatsby/graphql` exports all builtin GraphQL types as well as `graphQLJSON` type.

```diff
-const { GraphQLString } = require(`graphql`)
+const { GraphQLString } = require(`gatsby/graphql`)
```

### Add `gatsby-plugin-flow` if you are using Flowtype

`@babel/preset-flow` was removed from Gatsby's default babel configuration to make it easier to allow users to choose their own transpiler. If your site has its own `.babelrc` that already includes the Flow preset, no changes are necessary. Otherwise, you should install [`gatsby-plugin-flow`](/packages/gatsby-plugin-flow).

## For Explorers

### Starting a New Project with v2

Here's a brief section on starting a new project with Gatsby v2 instead of upgrading an existing project.

_Start from scratch:_ If you're a _start from scratch_ kind of person, you can install the Gatsby beta and React like this: `npm install gatsby@next react react-dom`

_Tutorial:_ If you'd like a step-by-step guide, [follow the tutorial](/tutorial/) to get started with Gatsby v2.

_Starters:_ If you'd rather use one of the official starters, you're in luck, there's a v2 edition for each of them. Install your favourite one with the Gatsby CLI.

`gatsby-starter-default` with v2:

```
gatsby new my-default-project https://github.com/gatsbyjs/gatsby-starter-default#v2
```

`gatsby-starter-hello-world` with v2:

```
gatsby new my-hello-world https://github.com/gatsbyjs/gatsby-starter-hello-world#v2
```

`gatsby-starter-blog` with v2:

```
gatsby new my-blog https://github.com/gatsbyjs/gatsby-starter-blog#v2
```
