import { getInternalPackage } from '$lib/server/package';
import { getRequestEvent, query } from '$app/server';
import type { Dependency } from '$lib/data/types';
import type { Edge, Node } from '@xyflow/svelte';
import * as ve from '$lib/server/valibot';
import * as v from 'valibot';

export interface NodeData {
	[key: string]: unknown;
	label: string;
}

export const getDependencyTree = query(ve.specifierExact, async (specifier) => {
	const event = getRequestEvent();

	const nodes = new Map<string, Node<NodeData>>();
	const edges: Edge[] = [];

	async function createNode(dep: Dependency) {
		const spec = v.safeParse(ve.specifier, `${dep.name}@${dep.version}`);

		if (!spec.success || !dep.registry) {
			const node = {
				id: `${dep.name}@${dep.version}`,
				position: { x: 0, y: 0 },
				data: {
					label: `${dep.name}@${dep.version}`,
				},
			};

			nodes.set(node.id, node);
			return node;
		}

		const pkg = await getInternalPackage(spec.output, event.platform!);
		const id = `${pkg.name}@${pkg.version}`;

		if (nodes.has(id)) {
			return nodes.get(id)!;
		}

		const node: Node<NodeData> = {
			id: id,
			position: { x: 0, y: 0 },
			data: {
				// name: dep.name,
				// version: dep.version,
				// optional: dep.optional,
				label: id,
			},
		};

		nodes.set(node.id, node);

		const deps = await Promise.all(
			pkg.dependencies
				.filter((dep) => dep.type === 'prod')
				.map(async (dep) => await createNode(dep)),
		);

		for (const dep of deps) {
			edges.push({
				id: `${node.id}-${dep.id}`,
				source: node.id,
				target: dep.id,
			});
		}

		return node;
	}

	await createNode({
		type: 'prod',
		name: specifier.name,
		version: specifier.version,
		optional: false,
		registry: true,
	});

	return {
		nodes: nodes.values().toArray(),
		edges,
	};
});
