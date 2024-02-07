import { getPathKey, normalizePathSeparators } from "./utils";
import type { Configuration } from "webpack";
import type { TestRunnerCoreConfig } from "@web/test-runner-core";
import { globSync } from "fast-glob";

// Copied from https://github.com/modernweb-dev/web/blob/master/packages/test-runner-core/src/runner/collectTestFiles.ts
function collectTestFiles(patterns: TestRunnerCoreConfig["files"]): string[] {
	const normalizedPatterns = [patterns].flat().map(normalizePathSeparators);

	return globSync(normalizedPatterns, { absolute: true });
}

export function filesToWebpackEntries(
	files: TestRunnerCoreConfig["files"],
): Configuration["entry"] {
	const entries: Configuration["entry"] = {};
	const testFiles = collectTestFiles(files);

	for (const testFile of testFiles) {
		entries[getPathKey(testFile)] = testFile;
	}

	return entries;
}
