<script lang="ts">
	import '@xyflow/svelte/dist/style.css';
	import { getDependencyTree, type NodeData } from './tree.remote';
	import Pending from '$lib/components/Pending.svelte';
	import Dagre from '@dagrejs/dagre';
	import { page } from '$app/state';
	import {
		SvelteFlow,
		Background,
		type Node,
		type Edge,
	} from '@xyflow/svelte';

	let { nodes, edges } = $derived(
		await getTree(page.data.pkg.name, page.data.pkg.version),
	);

	async function getTree(
		name: string,
		version: string,
	): Promise<{ nodes: Node<NodeData>[]; edges: Edge[] }> {
		const { nodes, edges } = await getDependencyTree({ name, version });
		const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
		g.setGraph({ rankdir: 'LR' });

		for (const edge of edges) {
			g.setEdge(edge.source, edge.target);
		}

		for (const node of nodes) {
			g.setNode(node.id, {
				...node,
				width: node.measured?.width ?? 150,
				height: node.measured?.height ?? 40,
			});
		}

		Dagre.layout(g);

		return {
			nodes: nodes.map((node) => {
				const position = g.node(node.id);
				// We are shifting the dagre node position (anchor=center center) to the top left
				// so it matches the Svelte Flow node anchor point (top left).
				const x = position.x - (node.measured?.width ?? 0) / 2;
				const y = position.y - (node.measured?.height ?? 0) / 2;

				return {
					...node,
					position: { x, y },
					sourcePosition: 'right',
					targetPosition: 'left',
				};
			}),
			edges,
		};
	}
</script>

<div class="wrapper">
	<Pending />
	<SvelteFlow bind:nodes bind:edges fitView colorMode="dark">
		<Background
			bgColor="var(--background-primary)"
			patternColor="var(--background-tertiary)"
		/>
	</SvelteFlow>
</div>

<style>
	.wrapper {
		width: 100%;
		height: 500px;
		position: relative;

		border: 2px solid var(--background-tertiary);
		border-radius: 12px;
		overflow: clip;

		--xy-handle-background-color: var(--background-tertiary);

		:global(.svelte-flow__attribution) {
			color: var(--text);
			background-color: unset;
		}

		:global(.svelte-flow__handle) {
			padding: 0px;
			margin: 0px;
		}
	}
</style>
