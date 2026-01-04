<script lang="ts">
	import IconQuestion from 'virtual:icons/lucide/circle-question-mark';
	import DropdownCodeblock from '$lib/DropdownCodeblock.svelte';
	import ModuleReplacements from './ModuleReplacements.svelte';
	import IconTS from 'virtual:icons/catppuccin/typescript';
	import { getPackage } from '$lib/data/package.remote';
	import IconPNPM from 'virtual:icons/catppuccin/pnpm';
	import IconYarn from 'virtual:icons/catppuccin/yarn';
	import IconDeno from 'virtual:icons/catppuccin/deno';
	import IconNPM from 'virtual:icons/catppuccin/npm';
	import IconBun from 'virtual:icons/catppuccin/bun';
	import IconCheck from 'virtual:icons/lucide/check';
	import IconMinus from 'virtual:icons/lucide/minus';
	import IconE18e from 'virtual:icons/custom/e18e';
	import README from './README.svelte';

	const { params } = $props();

	const pkg = $derived(await getPackage(params.specifier));

	const installPackages = $derived(
		`${pkg.name}${pkg.types.status === 'definitely-typed' ? ` ${pkg.types.definitelyTypedPkg}` : ''}`,
	);
</script>

<section class="main">
	<div class="readme">
		<README specifier={params.specifier} />
	</div>

	<div class="sidebar">
		<h6>Use Locally</h6>

		<DropdownCodeblock
			title="Select a package manager to install with"
			options={[
				{
					title: 'pnpm',
					icon: IconPNPM,
					content: `pnpm add ${installPackages}`,
				},
				{
					title: 'npm',
					icon: IconNPM,
					content: `npm install ${installPackages}`,
				},
				{
					title: 'yarn',
					icon: IconYarn,
					content: `yarn add ${installPackages}`,
				},
				{
					title: 'deno',
					icon: IconDeno,
					content: `deno add npm:${installPackages}`,
				},
				{
					title: 'bun',
					icon: IconBun,
					content: `bun add ${installPackages}`,
				},
			]}
		/>

		<h6>Use in Browser</h6>
		<!-- prettier-ignore -->
		<pre><code><span style="color: #BE95FF;">import</span> &#123;&#125; <span style="color: #BE95FF;">from</span> <span style="color: #F29E74;">'https://esm.sh/{pkg.name}@{pkg.version}'</span><span style="color: #F6F6F6B3;">;</span></code></pre>

		<hr />

		<h6>Stuff</h6>

		<ul>
			<li>
				<IconTS /> Type Definitions

				{#if pkg.types.status === 'built-in'}
					<span title="Types Built In" style="color: var(--green);">
						<IconCheck />
					</span>
				{:else if pkg.types.status === 'definitely-typed'}
					<span
						title="Only DefinitelyTyped"
						style="color: var(--orange);"
					>
						<IconMinus />
					</span>
				{:else}
					<span
						title="No Types Found, but the logic isn't perfect yet. Check NPM to be sure."
						style="color: var(--red);"
					>
						<IconQuestion />
					</span>
				{/if}
			</li>

			<li>
				<IconE18e /> e18e notes
				<ModuleReplacements replacements={pkg.moduleReplacements} />
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
