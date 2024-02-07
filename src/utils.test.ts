import {
	getPathKey,
	normalizePathSeparators,
	transformPathToJs,
} from "./utils";
import type path from "node:path";

type Sep = "/" | "\\";

let sep: Sep = "/";

jest.mock("node:path", (): typeof path => {
	const original: typeof path = jest.requireActual("node:path");

	return {
		...original,
		get sep(): Sep {
			return sep;
		},
	};
});

describe("utils", (): void => {
	describe("getPathKey", (): void => {
		it("should return a key with the format <file name>.<sha256 hash of file path>", (): void =>
			expect(getPathKey("/path/to/some/file.js")).toEqual(
				"file.79a6f67564b518ba78d1b40744c95a7589dd13fd82ce36d48d0f341ca01ff1fc",
			));

		it("should return a key with the format <file name>.<sha256 hash of file path>.<extension>", (): void =>
			expect(getPathKey("/path/to/some/file.js", true)).toEqual(
				"file.79a6f67564b518ba78d1b40744c95a7589dd13fd82ce36d48d0f341ca01ff1fc.js",
			));
	});

	describe("normalizePathSeparators", (): void => {
		it("should handle a path with backslash separators", (): void => {
			sep = "\\";
			expect(normalizePathSeparators("\\some\\path")).toEqual("/some/path");
		});

		it("should handle a path with forward slash separators", (): void =>
			expect(normalizePathSeparators("/some/path")).toEqual("/some/path"));
	});

	describe("transformPathToJs", (): void => {
		it("should force the file extension to .js", (): void =>
			expect(transformPathToJs("/path/to/some/file.ts")).toEqual(
				"/path/to/some/file.js",
			));
	});
});
