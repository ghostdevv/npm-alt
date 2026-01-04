<script lang="ts">
	import ModuleReplacements from './ModuleReplacements.svelte';
	import IconTS from 'virtual:icons/catppuccin/typescript';
	import { renderREADME } from '$lib/data/package.remote';
	import IconE18e from 'virtual:icons/custom/e18e';
	import TypeStatus from './TypeStatus.svelte';
	import Usage from './Usage.svelte';

	const { params, data } = $props();

	const readme = $derived(await renderREADME(params.specifier));
</script>

<section class="main">
	<div class="readme">
		{#if readme}
			{@html readme}
		{:else}
			<p style="color: var(--text-grey);">No README found</p>
		{/if}
	</div>

	<div class="sidebar">
		<h6>Use Locally</h6>

		<Usage pkg={data.pkg} />

		<hr />

		<h6>Stuff</h6>

		<ul>
			<li>
				<IconTS /> Type Definitions
				<TypeStatus types={data.pkg.types} />
			</li>

			<li>
				<IconE18e /> e18e notes
				<ModuleReplacements
					replacements={data.pkg.moduleReplacements}
				/>
			</li>
		</ul>
	</div>
</section>

<style>
	.main {
		display: grid;
		grid-template-columns: 1fr max-content;
		grid-gap: 32px;
		max-width: 100%;

		.readme {
			overflow-x: auto;
		}

		.sidebar {
			max-width: 300px;

			ul {
				list-style: none;
				margin-top: 12px;

				li {
					display: flex;
					align-items: center;
					gap: 6px;

					&:global(> :nth-child(2)) {
						display: grid;
						place-items: center;
						margin-left: auto;
					}
				}
			}
		}
	}
</style>
