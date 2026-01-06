import { getInternalPackage } from './package.server';
import { cached, USER_AGENT } from './common.server';
import { getRequestEvent, query } from '$app/server';
import { join as joinPaths } from '@std/path';
import * as ve from './valibot.server';
import { ofetch } from 'ofetch';
import mimes from 'mime-db';

interface UNPKGMetaResponse {
	package: string;
	version: string;
	prefix: string;
	files: {
		path: string;
		size: number;
		type: string;
		integrity: string;
	}[];
}

export interface FileNode {
	id: string;
	size: number;
	lang: string;
}

interface RawDirectoryNode {
	id: string;
	children: Map<string, RawTreeNode>;
}

interface DirectoryNode {
	id: string;
	size: number;
	children: TreeNode[];
}

type RawTreeNode = FileNode | RawDirectoryNode;
type TreeNode = FileNode | DirectoryNode;

function mimeToLang(mime: string) {
	switch (mime) {
		case 'text/typescript':
			return 'typescript';

		default:
			return mimes[mime]?.extensions?.[0] || 'txt';
	}
}

export const getPackageFiles = query(ve.specifier, async (specifier) => {
	const event = getRequestEvent();
	const pkg = await getInternalPackage(specifier, event.platform!);

	return await cached({
		key: `package-files:${pkg.name}-${pkg.version}`,
		platform: event.platform!,
		ttl: 600,
		async value() {
			const res = await ofetch<UNPKGMetaResponse>(
				`https://unpkg.com/${pkg.name}@${pkg.version}?meta`,
				{ headers: { 'User-Agent': USER_AGENT } },
			);

			const tree = new Map<string, RawTreeNode>();

			for (const file of res.files) {
				const path = file.path.replace(/^\//, '').split('/');
				let current = tree;

				for (let i = 0; i < path.length; i++) {
					const segment = path[i]!;
					const fullPath = joinPaths('/', ...path.slice(0, i + 1));

					if (i === path.length - 1) {
						current.set(segment, {
							id: fullPath,
							size: file.size,
							lang: mimeToLang(file.type),
						});
					} else {
						if (!current.has(segment)) {
							current.set(segment, {
								id: fullPath,
								children: new Map(),
							});
						}
						current = (current.get(segment) as RawDirectoryNode)
							.children;
					}
				}
			}

			function mapToArray(map: Map<string, RawTreeNode>): TreeNode[] {
				return map
					.values()
					.map((node): TreeNode => {
						if (!('children' in node)) {
							return node;
						}

						const children = mapToArray(node.children);

						return {
							id: node.id,
							size: children.reduce(
								(acc, child) => acc + child.size,
								0,
							),
							children,
						};
					})
					.toArray();
			}

			return mapToArray(tree);
		},
	});
});
