<script lang="ts">
	import IconQuestion from 'virtual:icons/lucide/circle-question-mark';
	import DropdownCodeblock from '$lib/DropdownCodeblock.svelte';
	import IconTS from 'virtual:icons/catppuccin/typescript';
	import IconPNPM from 'virtual:icons/catppuccin/pnpm';
	import IconYarn from 'virtual:icons/catppuccin/yarn';
	import IconDeno from 'virtual:icons/catppuccin/deno';
	import PackageLinks from '$lib/PackageLinks.svelte';
	import IconNPM from 'virtual:icons/catppuccin/npm';
	import IconBun from 'virtual:icons/catppuccin/bun';
	import IconCheck from 'virtual:icons/lucide/check';
	import IconMinus from 'virtual:icons/lucide/minus';
	import README from './README.svelte';
	import {
		definitelyTypedName,
		getPackageJSON,
		getPackage,
		hasTypes,
	} from './package';

	const { params } = $props();

	const pkg = $derived(await getPackage(params.name));
	const pkgJSON = $derived(getPackageJSON(pkg));
	const types = $derived(await hasTypes(pkgJSON));
	const installPackages = $derived(
		`${pkg.name}${types === 'dt' ? ` ${definitelyTypedName(pkg.name)}` : ''}`,
	);
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
					content: `deno add ${installPackages}`,
				},
				{
					title: 'bun',
					icon: IconBun,
					content: `bun add ${installPackages}`,
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

		<h6>Meta</h6>

		<ul>
			<li>
				<IconTS /> Type Definitions

				{#if types === 'built-in'}
					<span title="Types Built In" style="color: var(--green);">
						<IconCheck />
					</span>
				{:else if types === 'dt'}
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
		</ul>
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

			ul {
				list-style: none;
				margin-top: 12px;

				li {
					display: flex;
					align-items: center;
					gap: 6px;

					& > :last-child {
						display: grid;
						place-items: center;
						margin-left: auto;
					}
				}
			}
		}
	}
</style>
