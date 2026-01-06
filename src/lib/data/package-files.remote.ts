import { cached, resolveSpecifier } from './common.server';
import { getRequestEvent, query } from '$app/server';
import { join as joinPaths } from '@std/path';
import { vSpecifier } from '$lib/valibot';
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

export const getPackageFiles = query(vSpecifier, async (specifier) => {
	const event = getRequestEvent();
	const { name, version } = await resolveSpecifier(
		specifier,
		event.platform!,
	);

	return await cached(
		`package-files:${name}-${version}`,
		event.platform!,
		600,
		async () => {
			const res = await ofetch<UNPKGMetaResponse>(
				`https://unpkg.com/${name}@${version}?meta`,
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
	);
});
