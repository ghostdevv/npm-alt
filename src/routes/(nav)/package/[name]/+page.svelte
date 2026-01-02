<script lang="ts">
	import DropdownCodeblock from '$lib/DropdownCodeblock.svelte';
	import IconPNPM from 'virtual:icons/catppuccin/pnpm';
	import IconYarn from 'virtual:icons/catppuccin/yarn';
	import IconDeno from 'virtual:icons/catppuccin/deno';
	import PackageLinks from '$lib/PackageLinks.svelte';
	import IconNPM from 'virtual:icons/catppuccin/npm';
	import IconBun from 'virtual:icons/catppuccin/bun';
	import { getPackage } from './package';
	import README from './README.svelte';

	const { params } = $props();

	const pkg = $derived(await getPackage(params.name));
</script>

<section>
	<div class="name">
		<h1>
			{params.name}<span class="version">
				@{pkg['dist-tags'].latest}
			</span>
		</h1>

		<PackageLinks {pkg} />
	</div>
</section>

<section class="main">
	<div class="readme">
		<README readme={pkg.readme} />
	</div>

	<div class="sidebar">
		<h6>Use Locally</h6>

		<DropdownCodeblock
			title="Select a package manager to install with"
			options={[
				{
					title: 'pnpm',
					icon: IconPNPM,
					content: `pnpm add ${pkg.name}`,
				},
				{
					title: 'npm',
					icon: IconNPM,
					content: `npm install ${pkg.name}`,
				},
				{
					title: 'yarn',
					icon: IconYarn,
					content: `yarn add ${pkg.name}`,
				},
				{
					title: 'deno',
					icon: IconDeno,
					content: `deno add ${pkg.name}`,
				},
				{
					title: 'bun',
					icon: IconBun,
					content: `bun add ${pkg.name}`,
				},
			]}
		/>

		<h6>Use in Browser</h6>
		<pre><code
				>import &#123;&#125; from 'https://esm.sh/{pkg.name}@{pkg[
					'dist-tags'
				].latest}'</code
			></pre>

		<hr />
	</div>
</section>

<style>
	.name {
		display: flex;
		align-items: center;
		gap: 8px;

		h1 {
			margin-right: auto;

			.version {
				color: var(--text-grey);
			}
		}
	}

	.main {
		display: grid;
		grid-template-columns: 1fr max-content;
		grid-gap: 32px;

		.sidebar {
			max-width: 300px;
		}
	}
</style>
