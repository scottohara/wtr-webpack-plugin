export default {
	collectCoverage: true,
	collectCoverageFrom: ["src/**/*.{js,ts}"],
	forceCoverageMatch: ["**/*.test.ts"],
	preset: "ts-jest/presets/js-with-ts",
	moduleDirectories: ["src", "node_modules"],
	restoreMocks: true,
};
