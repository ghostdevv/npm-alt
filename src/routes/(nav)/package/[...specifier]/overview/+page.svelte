<script lang="ts">
	import ModuleReplacements from './ModuleReplacements.svelte';
	import IconTS from 'virtual:icons/catppuccin/typescript';
	import { renderREADME } from '$lib/data/package.remote';
	import { failed, pending } from '$lib/boundary.svelte';
	import Notice from '$lib/components/Notice.svelte';
	import IconE18e from 'virtual:icons/custom/e18e';
	import TypeStatus from './TypeStatus.svelte';
	import Usage from './Usage.svelte';
	import DOMPurify from 'dompurify';

	const { params, data } = $props();
</script>

<section class="main">
	<div class="readme">
		{#if data.pkg.deprecated}
			<Notice
				id="deprecated:{data.pkg.name}@{data.pkg.version}"
				colour="var(--red)"
			>
				<h4>Package Deprecated</h4>
				<p>{data.pkg.deprecated}</p>
			</Notice>
		{/if}

		{#if data.pkg.moduleReplacements.length}
			<Notice
				id="module-replacements:{data.pkg.name}@{data.pkg.version}"
				colour="var(--orange)"
			>
				<h4 class="row">
					<IconE18e /> e18e recommendations found
				</h4>

				<p>
					e18e is working to improve ecosystem health through cleaning
					up packages, or recommending alternatives. There is {data
						.pkg.moduleReplacements.length} recommendation{data.pkg
						.moduleReplacements.length === 1
						? ''
						: 's'} found for this package.
				</p>

				<ModuleReplacements
					replacements={data.pkg.moduleReplacements}
					inline={false}
				/>
			</Notice>
		{/if}

		<svelte:boundary {failed} {pending}>
			{@const readme = await renderREADME(params.specifier)}

			{#if $effect.pending()}
				{@render pending()}
			{/if}

			{#if readme}
				{@html DOMPurify.sanitize(readme.unsafeHTML)}
			{:else}
				<p style="color: var(--text-grey);">No README found</p>
			{/if}
		</svelte:boundary>
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
