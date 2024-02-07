import { join, resolve as resolveFilePath } from "node:path";
import webpack, {
	type Compiler,
	type Configuration,
	type Stats,
	type Watching,
} from "webpack";
import { merge } from "webpack-merge";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";

const defaultOutputFilename = "[name].js";

const defaultConfig: Configuration = {
	mode: "development",
	output: {
		filename: defaultOutputFilename,
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

function validateUserConfig(userConfig: Configuration): Configuration {
	const validConfig: Configuration = { ...userConfig };
	const { entry, output, optimization } = validConfig;

	if (undefined !== entry) {
		console.warn(
			"webpack entries will be automatically created from each of your test files. The entry specified in the webpack config will be ignored.",
		);
		delete validConfig.entry;
	}

	if (undefined !== output) {
		const outputFilename = output.filename ?? defaultOutputFilename;

		if (outputFilename !== defaultOutputFilename) {
			console.warn(
				"webpack output filename set to [name].js. The output filename specified in the webpack config will be ignored.",
			);
			delete output.filename;
		}
	}

	if (undefined !== optimization) {
		console.warn(
			"The optimization settings specified in the webpack config will be ignored.",
		);
		delete validConfig.optimization;
	}

	return validConfig;
}

export function compilationHandler(
	statsConfig: Configuration["stats"],
	path: string,
	resolve: () => void,
	reject: () => void,
): [Map<string, string>, Watching["handler"]] {
	const bundlesContent = new Map<string, string>();

	return [
		bundlesContent,
		function handleCompilation(
			err?: (Error & { details?: string }) | null,
			stats?: Stats,
		): void {
			bundlesContent.clear();

			if (undefined !== err && null !== err) {
				console.error(err.stack ?? err);
				if (undefined !== err.details) {
					console.error(err.details);
				}

				reject();

				return;
			}

			console.log(stats?.toString(statsConfig));

			for (const { name } of stats?.toJson().assets ?? []) {
				const filePath = resolveFilePath(path, name);

				bundlesContent.set(name, readFileSync(filePath, "utf8"));
			}

			resolve();
		},
	];
}

export function generateConfig(
	userConfig: Configuration,
	pluginConfig: Configuration,
): Configuration {
	const validConfig = validateUserConfig(userConfig);

	return merge(defaultConfig, validConfig, pluginConfig);
}

export function getCompiler(
	config: Configuration,
	callback?: Watching["handler"],
): Compiler {
	return webpack(config, callback);
}

export function outputPath(): string {
	const ENTROPY_SIZE = 1000000;

	return `${join(tmpdir(), "_wtr_webpack_")}${Math.floor(
		Math.random() * ENTROPY_SIZE,
	)}`;
}
