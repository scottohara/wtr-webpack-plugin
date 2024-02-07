![Web Test Runner](assets/web-test-runner.svg "Web Test Runner")
![loves](assets/red-heart-icon.svg)
![webpack](assets/webpack.svg "webpack")

A [Web Test Runner][1] plugin that prebundles your code using [webpack][2].

# !! Warning !!

This is pre-alpha software that is currently in an incomplete state.

# Who is this for?

This plugin _could_ be for you if:

1. You use [webpack][2] to bundle your source code, unit test code, or both
2. You use (or previously used) [karma][3] + [karma-webpack][4] to run your unit tests
3. You are looking to switch to [Web Test Runner][1] due to [the deprecation of karma][5]
4. You prefer running your unit tests in _actual_ browsers rather than emulated browser environments such as [jsdom][6] or [happy-dom][7]

For more on why this plugin exists, see [Rationale](#rationale).

# Install

```sh
npm install --save-dev wtr-webpack-plugin @web/test-runner
```

# Usage

`web-test-runner.config.mjs`

```js
import { webpackPlugin } from "wtr-webpack-plugin";

export default {
	// specify your test files as per normal
	files: "**/*.test.(t|j)s", // example: all *.test.ts and *.test.js files

	plugins: [
		webpackPlugin({
			// any custom webpack configuration here (see below)
		}),
	],
};
```

# webpack configuration

The plugin uses the following default webpack configuration to bundle your code and tests:

```js
{
  mode: "development",
  output: {
    filename: "[name].js",
    path: `${path.join(os.tmpdir(), "_wtr_webpack_")}${Math.floor(Math.random() * 1000000)}`
  },
  stats: {
    modules: false,
    colors: true,
  },
  watch: false,
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all",
      minSize: 0,
      cacheGroups: {
        commons: {
          name: "commons",
          chunks: "all",
          minChunks: 1,
        },
      },
    },
  },
  plugins: [],
};
```

You can extend or override this by providing additional webpack configuration to the plugin in your `web-test-runner.config.mjs` file. Any additional configuration is merged into the defaults above, with user supplied configuration taking precedence.

There are some configuration settings that must be omitted from the webpack configuration:

1. Do not provide an `entry` option. The plugin dynamically generates the `entry` from the `files` specified in your `web-test-runner.config.mjs` file, so the resulting bundle will contain:
   - 1 x `commons.js` chunk for all shared code
   - 1 x `runtime.js` chunk for the webpack runtime
   - _N_ x chunks (one per test file)
2. Do not modify the `output.filename` option from `[name].js`
3. Do not provide any custom `optimization` configuration. The plugin expects the specific chunks as listed above.

# Rationale

Modern Web encourages [going buildless][8] by leveraging features of modern browsers such as ubiquitous support for ES modules. Web Test Runner loads your `*.test.js` files into the browser using `<script type="module">` without the need to bundle first.

For other common content types like Typescript, JSX, TSX and JSON; the [esbuildPlugin][9] can be used to [transform files on the fly][10] as they are requested from the Dev Server (note that this uses the [esbuild single file transform API][11], and not the bundling API, so there are some limitations).

However if you have an existing build process that uses [webpack][2], chances are that your code depends on certain loaders, plugins or other webpack-specific behaviour. So going buildless may not be an option for you. At this point you could:

1. Prebundle your code _before_ launching the Test Runner (e.g. `npm run build && npm test`), and point Test Runner at the output of build process
2. Configure `esbuildPlugin` with additional loaders and custom configurations, duplicating parts of your `webpack` build process that your code depends on
3. Migrate your existing `webpack` build process to `esbuild` so that it can be used both for building and by Web Test Runner

### Migrating from Karma

Perhaps you are considering Web Test Runner as a potential replacement for Karma, which is [now officially deprecated][5]?

You may have been using [karma-webpack][4] to prebundle your code & tests for Karma, and you’re now looking swap out Karma for Web Test Runner without having to change too much else of your existing test setup.

If this is you, then this plugin could be exactly what you need. It is basically `karma-webpack` ported to work with Web Test Runner.

# How does it work?

Essentially it works just like karma-webpack. In fact, most of the code is heavily influenced by (and in some cases, directly copied from) their work. Open source FTW.

When the Test Runner is launched, the plugin converts the `files` pattern(s) specified in `web-test-runner.config.mjs` into webpack entries, one per test file.

`webpack` uses this generated config to create one chunk for each test file, along with a `commons.js` chunk for shared code.

Web Test Runner uses `<script type="module">` tags to load your test files into the browser, and as each test file is requested from the Dev Server, the plugin intercepts the request and returns the bundled content for that chunk instead of the actual test file.

# Credits

This plugin is a direct port of `karma-webpack` to work with Web Test Runner. All credit goes to the past, present and future maintainers of that project.

# Contributing

I mostly created this plugin to scratch my own itch, as I looked to replace Karma with Web Test Runner. As a result, I have not extensively tested it across a range of different projects or webpack configurations.

There are likely to be some corner cases that work in karma-webpack that don't work here simply because I don't use them.

If you find something that doesn't work for your setup, contributions are welcome.

[1]: https://modern-web.dev/docs/test-runner/overview/
[2]: https://webpack.js.org/
[3]: https://karma-runner.github.io/latest/index.html
[4]: https://github.com/codymikol/karma-webpack
[5]: https://github.com/karma-runner/karma?tab=readme-ov-file#karma-is-deprecated-and-is-not-accepting-new-features-or-general-bug-fixes
[6]: https://github.com/jsdom/jsdom
[7]: https://github.com/capricorn86/happy-dom
[8]: https://modern-web.dev/guides/going-buildless/getting-started/
[9]: https://modern-web.dev/docs/dev-server/plugins/esbuild/
[10]: https://modern-web.dev/guides/test-runner/typescript/
[11]: https://modern-web.dev/docs/dev-server/plugins/esbuild/#single-file-transforms
