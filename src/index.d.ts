import type { Compiler } from "webpack";
import type { TestRunnerPlugin } from "@web/test-runner-core";

export type WebpackTestRunnerPlugin = TestRunnerPlugin & {
	compiler?: Compiler;
	bundlesContent?: Map<string, string>;
};
