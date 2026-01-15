<script lang="ts">
	import '@xyflow/svelte/dist/style.css';
	import IconRefresh from 'virtual:icons/lucide/refresh-cw';
	import IconLink from 'virtual:icons/lucide/external-link';
	import { fitNodeInViewport, isVisible } from './utils';
	import DependencyNode from './DependencyNode.svelte';
	import { getDependencyGraph } from './graph.remote';
	import type { PageData } from './$types';
	import Dagre from '@dagrejs/dagre';
	import { page } from '$app/state';
	import {
		ControlButton,
		useSvelteFlow,
		SvelteFlow,
		Background,
		Position,
		Controls,
	} from '@xyflow/svelte';

	const pkg = $derived((page.data as PageData).pkg);
	const { fitView, getViewport, setViewport } = useSvelteFlow();

	let height = $state(0);
	let width = $state(0);

	let { nodes, edges } = $derived(
		await getDependencyGraph({
			name: pkg.name,
			version: pkg.version,
		}),
	);

	async function position() {
		const graph = new Dagre.graphlib.Graph()
			.setDefaultEdgeLabel(() => ({}))
			.setGraph({ rankdir: 'LR', nodesep: 15, ranksep: 25 });

		const newNodes = structuredClone(nodes);

		for (const edge of edges) {
			graph.setEdge(edge.source, edge.target);
		}

		for (const node of newNodes) {
			graph.setNode(node.id, {
				...node,
				width: node.measured?.width ?? 0,
				height: node.measured?.height ?? 0,
			});
		}

		Dagre.layout(graph);

		for (const node of newNodes) {
			const position = graph.node(node.id);
			// We are shifting the dagre node position (anchor=center center) to the top left
			// so it matches the Svelte Flow node anchor point (top left).
			const x = position.x - (node.measured?.width ?? 0) / 2;
			const y = position.y - (node.measured?.height ?? 0) / 2;

			node.position = { x, y };
			node.sourcePosition = Position.Right;
			node.targetPosition = Position.Left;
		}

		nodes = newNodes;

		await fitView();
		const root = nodes.find((n) => n.id === `${pkg.name}@${pkg.version}`);
		const vp = getViewport();

		if (root && !isVisible(root, vp, width, height)) {
			const newVp = fitNodeInViewport(root, vp, width, height);
			await setViewport(newVp);
		}
	}

	let initiallyPositioned = $state(false);

	$effect(() => {
		if (nodes[0]?.measured && !initiallyPositioned) {
			initiallyPositioned = true;
			position();
		}
	});
</script>

<div class="graph" bind:clientWidth={width} bind:clientHeight={height}>
	<SvelteFlow
		bind:nodes
		bind:edges
		fitView
		colorMode="dark"
		nodeTypes={{ DependencyNode }}
		defaultEdgeOptions={{
			markerEnd: {
				type: 'arrow',
				strokeWidth: 1.5,
				color: 'var(--xy-edge-stroke)',
			},
		}}
	>
		<Background
			bgColor="var(--background-primary)"
			patternColor="var(--background-tertiary)"
		/>

		<Controls position="bottom-right" showFitView={false} showLock={false}>
			<ControlButton title="Reposition" onclick={() => position()}>
				<IconRefresh />
			</ControlButton>
			<ControlButton
				title="Open in npmgraph"
				onclick={() => {
					window.open(
						`https://npmgraph.js.org/?q=${pkg.name}@${pkg.version}`,
						'_blank',
					);
				}}
			>
				<IconLink />
			</ControlButton>
		</Controls>
	</SvelteFlow>
</div>

<style>
	.graph {
		width: 100%;
		height: 500px;

		--xy-handle-background-color: var(--background-tertiary);
		--xy-edge-stroke: color-mix(
			in oklab,
			var(--background-tertiary),
			white 15%
		);

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
