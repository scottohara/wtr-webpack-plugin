import { join, parse, sep } from "node:path";
import { createHash } from "node:crypto";

export function getPathKey(filePath: string, withExtension = false): string {
	const { name, ext } = parse(filePath);
	const key = `${name}.${createHash("sha256").update(filePath).digest("hex")}`;

	return withExtension ? `${key}${ext}` : key;
}

export function normalizePathSeparators(path: string): string {
	return path.split(sep).join("/");
}

export function transformPathToJs(path: string): string {
	const { dir, name } = parse(path);

	return `${join(dir, name)}.js`;
}
