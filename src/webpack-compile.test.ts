import {
	Compiler,
	type Configuration,
	type Stats,
	type Watching,
} from "webpack";
import {
	compilationHandler,
	generateConfig,
	getCompiler,
	outputPath,
} from "./webpack-compile";
import fs from "node:fs";
import os from "node:os";

describe("webpack", (): void => {
	describe("compilationHandler", (): void => {
		const resolve = jest.fn();
		const reject = jest.fn();

		let bundlesContent: Map<string, string>;
		let handleCompilation: Watching["handler"];

		beforeEach(
			(): [Map<string, string>, Watching["handler"]] =>
				([bundlesContent, handleCompilation] = compilationHandler(
					false,
					"/path/to/output",
					resolve,
					reject,
				)),
		);

		it("should return an empty map for bundle contents", (): void => {
			expect(bundlesContent).toBeInstanceOf(Map);
			expect(bundlesContent.size).toBe(0);
		});

		it("should return a callback function", (): void =>
			expect(handleCompilation).toBeInstanceOf(Function));

		describe("handleCompilation", (): void => {
			beforeEach((): jest.Mock => (console.log = jest.fn()));

			it("should clear the bundles content map", (): void => {
				bundlesContent.set("foo", "bar");
				handleCompilation();
				expect(bundlesContent.size).toBe(0);
			});

			describe("error", (): void => {
				const errorStack = "error stack";
				const errorDetails = "error details";

				let error: Error & { details?: string };

				beforeEach((): void => {
					console.error = jest.fn();
					error = new Error("error message");
				});

				it("should log the error stack if present", (): void => {
					error.stack = errorStack;
					handleCompilation(error);
					expect(console.error).toHaveBeenCalledWith(errorStack);
					expect(console.error).not.toHaveBeenCalledWith(errorDetails);
					expect(console.log).not.toHaveBeenCalled();
				});

				it("should log the error stack & details if present", (): void => {
					error.stack = errorStack;
					error.details = errorDetails;
					handleCompilation(error);
					expect(console.error).toHaveBeenCalledWith(errorStack);
					expect(console.error).toHaveBeenCalledWith(errorDetails);
					expect(console.log).not.toHaveBeenCalled();
				});

				it("should log the error itself if a stack is not present", (): void => {
					error.stack = undefined;
					handleCompilation(error);
					expect(console.error).toHaveBeenCalledWith(error);
					expect(console.error).not.toHaveBeenCalledWith(errorDetails);
					expect(console.log).not.toHaveBeenCalled();
				});

				it("should log the error details if present", (): void => {
					error.stack = undefined;
					error.details = errorDetails;
					handleCompilation(error);
					expect(console.error).toHaveBeenCalledWith(error);
					expect(console.error).toHaveBeenCalledWith(errorDetails);
					expect(console.log).not.toHaveBeenCalled();
				});

				it("should call the passed promise reject callback", (): void =>
					expect(reject).toHaveBeenCalled());
			});

			describe("success", (): void => {
				let stats: Partial<Stats>;

				beforeEach((): void => {
					jest.spyOn(fs, "readFileSync").mockReturnValue("file contents");
					stats = {
						toString: jest.fn().mockReturnValue("stats string"),
						toJson: jest.fn().mockReturnValue({
							assets: [{ name: "testA.js" }, { name: "testB.js" }],
						}),
					};

					handleCompilation(undefined, stats as Stats);
				});

				it("should log the build output as a string", (): void =>
					expect(console.log).toHaveBeenCalledWith("stats string"));

				it("should populate the bundles content map", (): void => {
					expect(fs.readFileSync).toHaveBeenNthCalledWith(
						1,
						"/path/to/output/testA.js",
						"utf8",
					);
					expect(fs.readFileSync).toHaveBeenNthCalledWith(
						2,
						"/path/to/output/testB.js",
						"utf8",
					);
					expect(bundlesContent.size).toBe(2);
					expect(bundlesContent).toEqual(
						new Map([
							["testA.js", "file contents"],
							["testB.js", "file contents"],
						]),
					);
				});

				it("should call the passed promise resolve callback", (): void =>
					expect(resolve).toHaveBeenCalled());
			});
		});
	});

	describe("generateConfig", (): void => {
		beforeEach((): jest.Mock => (console.warn = jest.fn()));

		it("should use default values where not otherwise specified", (): void =>
			expect(generateConfig({}, {})).toHaveProperty("mode", "development"));

		it("should use user supplied values where specified", (): void =>
			expect(generateConfig({ mode: "production" }, {})).toHaveProperty(
				"mode",
				"production",
			));

		it("should use plugin values where specified", (): void =>
			expect(generateConfig({}, { entry: "entry.js" })).toHaveProperty(
				"entry",
				"entry.js",
			));

		describe("entry", (): void => {
			it("should warn if the user config includes an entry property", (): void => {
				expect(generateConfig({ entry: "entry.js" }, {})).not.toHaveProperty(
					"entry",
				);
				expect(console.warn).toHaveBeenCalled();
			});

			it("should not warn if the user config omits an entry property", (): void => {
				expect(generateConfig({}, {})).not.toHaveProperty("entry");
				expect(console.warn).not.toHaveBeenCalled();
			});
		});

		describe("output filename", (): void => {
			it("should warn if the user config modifies the output filename property", (): void => {
				expect(
					generateConfig({ output: { filename: "out.js" } }, {}).output,
				).toHaveProperty("filename", "[name].js");
				expect(console.warn).toHaveBeenCalled();
			});

			it("should not warn if the user config matches the output filename property", (): void => {
				expect(
					generateConfig({ output: { filename: "[name].js" } }, {}).output,
				).toHaveProperty("filename", "[name].js");
				expect(console.warn).not.toHaveBeenCalled();
			});

			it("should not warn if the user config omits the output filename property", (): void => {
				expect(generateConfig({ output: {} }, {}).output).toHaveProperty(
					"filename",
					"[name].js",
				);
				expect(console.warn).not.toHaveBeenCalled();
			});
		});

		describe("optimization", (): void => {
			it("should warn if the user config includes an optimization property", (): void => {
				expect(
					generateConfig({ optimization: {} }, {}).optimization,
				).toHaveProperty("runtimeChunk", "single");
				expect(console.warn).toHaveBeenCalled();
			});

			it("should not warn if the user config omits an optimization property", (): void => {
				expect(generateConfig({}, {}).optimization).toHaveProperty(
					"runtimeChunk",
					"single",
				);
				expect(console.warn).not.toHaveBeenCalled();
			});
		});
	});

	describe("getCompiler", (): void => {
		it("should return a configured compiler", (): void => {
			const config: Configuration = {};

			expect(getCompiler(config)).toBeInstanceOf(Compiler);
		});
	});

	describe("outputPath", (): void => {
		it("should return a random temporary path", (): void => {
			jest.spyOn(os, "tmpdir").mockReturnValue("/temp/dir/");
			jest.spyOn(Math, "random").mockReturnValue(0.5);
			expect(outputPath()).toBe("/temp/dir/_wtr_webpack_500000");
		});
	});
});
