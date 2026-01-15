<script lang="ts">
	import PackageCardHeader from '$lib/components/PackageCardHeader.svelte';
	import type { DependencyNodeProps } from './graph.remote';
	import { Handle, Position } from '@xyflow/svelte';

	const { isConnectable, data }: DependencyNodeProps = $props();
</script>

<div class="node">
	<Handle type="target" position={Position.Left} {isConnectable} />
	<PackageCardHeader {...data} />
	<Handle type="source" position={Position.Right} {isConnectable} />
</div>

<style>
	.node {
		display: flex;
		align-items: center;
		gap: 8px;

		position: relative;

		background-color: var(--background-secondary);
		border: 2px solid var(--background-tertiary);
		padding: 6px 8px;
		border-radius: 12px;
	}
</style>
