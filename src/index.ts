import type { Context, ServerStartParams } from "@web/dev-server-core";
import {
	compilationHandler,
	generateConfig,
	getCompiler,
	outputPath,
} from "./webpack-compile";
import {
	getPathKey,
	normalizePathSeparators,
	transformPathToJs,
} from "./utils";
import type { Configuration } from "webpack";
import type { TestRunnerCoreConfig } from "@web/test-runner-core";
import type { WebpackTestRunnerPlugin } from "./index.d";
import { filesToWebpackEntries } from "./web-test-runner";

export function webpackPlugin(
	userConfig: Configuration,
): WebpackTestRunnerPlugin {
	async function serverStart(
		this: WebpackTestRunnerPlugin,
		{ config }: ServerStartParams,
	): Promise<void> {
		const { files, watch } = config as TestRunnerCoreConfig;
		const entry = filesToWebpackEntries(files);
		const path = outputPath();
		const webpackConfig = generateConfig(userConfig, {
			entry,
			output: {
				path,
			},
			watch,
		});

		(config as TestRunnerCoreConfig).watch = false;

		return new Promise((resolve, reject): void => {
			const [emptyBundlesContent, handleCompilation] = compilationHandler(
				userConfig.stats,
				path,
				resolve,
				reject,
			);

			this.bundlesContent = emptyBundlesContent;
			this.compiler = getCompiler(webpackConfig, handleCompilation);
		});
	}

	function serverStop(this: WebpackTestRunnerPlugin): void {
		if (undefined !== this.compiler) {
			this.compiler.close((): void => undefined);
		}
	}

	function serve(
		this: WebpackTestRunnerPlugin,
		{ request }: Context,
	):
		| string
		| { body: string; type?: string; headers?: Record<string, string> } {
		const path = transformPathToJs(
			getPathKey(normalizePathSeparators(request.path), true),
		);

		return (
			this.bundlesContent?.get(path) ?? {
				body: "Not found",
				headers: { status: "404 Not found" },
			}
		);
	}

	return {
		name: "wtr-webpack-plugin",
		serverStart,
		serverStop,
		serve,
	};
}
