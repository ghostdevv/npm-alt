import type { Props as NodeData } from '$lib/components/PackageCardHeader.svelte';
import type { Edge, Node as NodeType, NodeProps } from '@xyflow/svelte';
import { packageTypeStatus } from '$lib/server/package-types';
import { getInternalPackage } from '$lib/server/package';
import { getRequestEvent, query } from '$app/server';
import type { Dependency } from '$lib/data/types';
import * as ve from '$lib/server/valibot';
import * as v from 'valibot';

export type Node = NodeType<
	NodeData & Record<string, unknown>,
	'DependencyNode'
>;

export type DependencyNodeProps = NodeProps<Node>;

export const getDependencyGraph = query(
	ve.specifierExact,
	async (specifier) => {
		const event = getRequestEvent();

		const nodes = new Map<string, Node>();
		const edges: Edge[] = [];

		async function createNode(dep: Dependency) {
			const spec = v.safeParse(
				ve.specifier,
				`${dep.name}@${dep.version}`,
			);

			if (!spec.success || !dep.registry) {
				const node: Node = {
					id: `${dep.name}@${dep.version}`,
					type: 'DependencyNode',
					position: { x: 0, y: 0 },
					data: {
						name: dep.name,
						version: dep.version,
					},
				};

				if (dep.optional) {
					node.data.state = 'optional';
				}

				nodes.set(node.id, node);
				return node;
			}

			const pkg = await getInternalPackage(spec.output, event.platform!);
			const types = await packageTypeStatus(pkg, event.platform!);
			const id = `${pkg.name}@${pkg.version}`;

			if (nodes.has(id)) {
				return nodes.get(id)!;
			}

			const node: Node = {
				id: id,
				type: 'DependencyNode',
				position: { x: 0, y: 0 },
				data: {
					name: pkg.name,
					version: pkg.version,
					types: types.status,
					optional: dep.optional,
					deprecated: !!pkg.deprecated,
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
					animated: dep.data.optional,
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
	},
);
