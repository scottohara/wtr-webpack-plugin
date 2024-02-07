import { filesToWebpackEntries } from "./web-test-runner";
import { join } from "node:path";

describe("web-test-runner", (): void => {
	describe("filesToWebpackEntries", (): void => {
		it("should return a webpack entry for every file that matches the passed glob patterns", (): void => {
			const actual = filesToWebpackEntries(["test/**/*.(t|j)s"]);

			expect(actual).toEqual({
				"sample.39022c5503c993de3efc1c24db2e3794a7ee27ef395504aec69df2cdc5b79dec":
					join(process.cwd(), "test/sample.ts"),
				"sample.b3f9d57040ccac78942bd4c591e71bbc197b08b8e4d75cfbc99beddd12273de3":
					join(process.cwd(), "test/sample.js"),
			});
		});
	});
});
