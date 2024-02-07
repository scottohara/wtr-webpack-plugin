import type { Context, ServerStartParams } from "@web/dev-server-core";
import type { Compiler } from "webpack";
import type { TestRunnerCoreConfig } from "@web/test-runner-core";
import type { WebpackTestRunnerPlugin } from "./index.d";
import { join } from "node:path";
import { webpackPlugin } from "./index";

describe("wtr-webpack-plugin", (): void => {
	const config = {
		files: "test/**/*.(j|t)s",
	} as TestRunnerCoreConfig;
	const serverStartParams = { config } as unknown as ServerStartParams;

	let plugin: WebpackTestRunnerPlugin;

	beforeAll(async (): Promise<void> => {
		console.log = jest.fn();
		plugin = webpackPlugin({});
		await plugin.serverStart?.(serverStartParams);
	});

	describe("webpackPlugin", (): void => {
		it("should return the plugin name", (): void =>
			expect(plugin.name).toEqual("wtr-webpack-plugin"));

		it("should return a serverStart hook function", (): void =>
			expect(plugin.serverStart?.bind(plugin)).toBeInstanceOf(Function));

		it("should return a serverStop hook function", (): void =>
			expect(plugin.serverStop?.bind(plugin)).toBeInstanceOf(Function));

		it("should return a serve hook function", (): void =>
			expect(plugin.serve?.bind(plugin)).toBeInstanceOf(Function));
	});

	describe("serverStart", (): void => {
		const bundlesContent = new Map([
			["commons.js", expect.any(String)],
			["runtime.js", expect.any(String)],
			[
				"sample.39022c5503c993de3efc1c24db2e3794a7ee27ef395504aec69df2cdc5b79dec.js",
				expect.stringContaining("./test/sample.ts"),
			],
			[
				"sample.b3f9d57040ccac78942bd4c591e71bbc197b08b8e4d75cfbc99beddd12273de3.js",
				expect.stringContaining("./test/sample.js"),
			],
		]);

		describe("watch mode", (): void => {
			beforeAll(async (): Promise<void> => {
				config.watch = true;
				plugin = webpackPlugin({ watch: true });
				await plugin.serverStart?.(serverStartParams);
			});

			it("should disable the test runner watcher in favour of the webpack watcher", (): void =>
				expect(config.watch).toBe(false));

			it("should populate the bundles content map", (): void =>
				expect(plugin.bundlesContent).toEqual(bundlesContent));
		});

		describe("single run mode", (): void => {
			it("should populate the bundles content map", (): void =>
				expect(plugin.bundlesContent).toEqual(bundlesContent));
		});
	});

	describe("serverStop", (): void => {
		it("should close the compiler if it is defined", async (): Promise<void> => {
			const close = jest.spyOn(plugin.compiler as Compiler, "close");

			await plugin.serverStop?.();
			expect(close).toHaveBeenCalled();
		});
	});

	describe("serve", (): void => {
		it("should serve the bundled contents for the requested file", (): void =>
			expect(
				plugin.serve?.({
					request: {
						path: join(process.cwd(), "test/sample.ts"),
					},
				} as unknown as Context),
			).toMatch("./test/sample.ts"));

		it("should serve a 404 if the requested file was not in the bundle output", (): void =>
			expect(
				plugin.serve?.({
					request: {
						path: "./non-existant",
					},
				} as unknown as Context),
			).toMatchObject({
				body: "Not found",
				headers: { status: "404 Not found" },
			}));
	});
});
