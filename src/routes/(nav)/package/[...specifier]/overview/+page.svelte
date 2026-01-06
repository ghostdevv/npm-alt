<script lang="ts">
	import IconCalendarUp from 'virtual:icons/lucide/calendar-arrow-up';
	import IconCalendarClock from 'virtual:icons/lucide/calendar-clock';
	import IconCalendarPlus from 'virtual:icons/lucide/calendar-plus';
	import ModuleReplacements from './ModuleReplacements.svelte';
	import IconLicense from 'virtual:icons/catppuccin/license';
	import IconTS from 'virtual:icons/catppuccin/typescript';
	import { format as formatBytes } from '@std/fmt/bytes';
	import IconWeight from 'virtual:icons/lucide/weight';
	import Notice from '$lib/components/Notice.svelte';
	import IconE18e from 'virtual:icons/custom/e18e';
	import { formatDistanceToNow } from 'date-fns';
	import TypeStatus from './TypeStatus.svelte';
	import README from './README.svelte';
	import Usage from './Usage.svelte';

	const { data } = $props();
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

		{#if data.pkg.replacements.length}
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
						.pkg.replacements.length} recommendation{data.pkg
						.replacements.length === 1
						? ''
						: 's'} found for this package.
				</p>

				<ModuleReplacements
					replacements={data.pkg.replacements}
					inline={false}
				/>
			</Notice>
		{/if}

		<README pkg={data.pkg} />
	</div>

	<div class="sidebar">
		<h6>Use Locally</h6>

		<Usage pkg={data.pkg} />

		<hr />

		<h6>Version Notes</h6>

		<ul>
			<li>
				<IconTS /> Type Definitions
				<TypeStatus types={data.pkg.types} />
			</li>

			<li>
				<IconE18e /> e18e suggestions
				<ModuleReplacements replacements={data.pkg.replacements} />
			</li>

			<li>
				<IconLicense /> License
				<span>{data.pkg.license ?? '???'}</span>
			</li>

			<li>
				<IconCalendarClock color="#206eaa" /> Published At
				<span title={data.pkg.publishedAt.toISOString()}>
					{formatDistanceToNow(data.pkg.publishedAt, {
						addSuffix: true,
					})}
				</span>
			</li>

			<li>
				<IconWeight color="#39454f" /> Unpacked Size
				<span>
					{#if data.pkg.unpackedSize}
						{formatBytes(data.pkg.unpackedSize)}
					{:else}
						???
					{/if}
				</span>
			</li>
		</ul>

		<hr />

		<h6>Package Notes</h6>

		<ul>
			<li>
				<IconCalendarUp color="#b745ac" /> Last Updated
				<span title={data.pkg.updatedAt.toISOString()}>
					{formatDistanceToNow(data.pkg.updatedAt, {
						addSuffix: true,
					})}
				</span>
			</li>

			<li>
				<IconCalendarPlus color="#7035d6" /> Created At
				<span title={data.pkg.createdAt.toISOString()}>
					{Intl.DateTimeFormat().format(data.pkg.createdAt)}
				</span>
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
				margin-block: 12px;

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

			hr {
				margin-block: 12px;
			}
		}
	}
</style>
