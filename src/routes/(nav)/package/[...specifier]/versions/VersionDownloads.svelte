<script lang="ts">
	import semverCompare from 'semver/functions/compare';
	import semverParse from 'semver/functions/parse';
	import { cache } from '$lib/client/cache';
	import { stringToColor } from './utils';
	import {
		Chart,
		BarController,
		BarElement,
		CategoryScale,
		LinearScale,
		Tooltip,
	} from 'chart.js';

	Chart.register(
		BarController,
		BarElement,
		CategoryScale,
		LinearScale,
		Tooltip,
	);

	interface VersionDownloadsResponse {
		downloads: Record<string, number>;
	}

	interface DownloadItem {
		label: string;
		downloads: number;
		versions: string[];
	}

	interface Props {
		name: string;
	}

	const { name }: Props = $props();
	const TOP_N = 6;

	const load = cache({
		version: 1,
		ttl: 300,
		async value() {
			// prettier-ignore
			const res = await fetch(`https://api.npmjs.org/versions/${name}/last-week`);
			const data = await res.json<VersionDownloadsResponse>();

			const groups: Record<
				string,
				{ downloads: number; versions: string[] }
			> = {};

			// Group by major/minor version
			for (const [version, downloads] of Object.entries(data.downloads)) {
				const versionParsed = semverParse(version)!;
				const group = versionParsed.major
					? `${versionParsed.major}.x`
					: `0.${versionParsed.minor}`;

				const g = (groups[group] ||= { downloads: 0, versions: [] });
				g.downloads += downloads;
				g.versions.push(version);
			}

			// Sort versions within each group
			for (const group of Object.values(groups)) {
				group.versions.sort((a, b) => semverCompare(b, a));
			}

			// Convert to array and sort by downloads
			const fullItems: DownloadItem[] = Object.entries(groups)
				.map(([label, data]) => ({
					label,
					downloads: data.downloads,
					versions: data.versions,
				}))
				.sort((a, b) => {
					return (
						b.downloads - a.downloads ||
						a.label.localeCompare(b.label)
					);
				});

			const items = fullItems.slice(0, TOP_N);
			const other = fullItems.slice(TOP_N);

			if (other.length) {
				items.push({
					label: 'Other',
					downloads: other.reduce(
						(sum, item) => sum + item.downloads,
						0,
					),
					versions: other.flatMap((item) => item.versions),
				});
			}

			return {
				items,
				labels: items.map((item) => item.label),
				datasets: [
					{
						label: 'Downloads',
						data: items.map((item) => item.downloads),
						backgroundColor: items.map((item) =>
							stringToColor(item.label),
						),
					},
				],
			};
		},
	});

	const data = $derived(await load(`version-downloads:${name}`));
</script>

<canvas
	{@attach (node) => {
		const chart = new Chart(node, {
			type: 'bar',
			data: { labels: data.labels, datasets: data.datasets },
			options: {
				indexAxis: 'y',
				responsive: true,
				plugins: {
					tooltip: {
						callbacks: {
							afterLabel: (ctx) => {
								const item = data.items[ctx.dataIndex];

								if (item.versions.length > 0) {
									return (
										'\n' +
										item.versions
											.slice(0, 5)
											.map((v) => `  ${v}`)
											.join('\n') +
										(item.versions.length > 5
											? `\n  ...and ${item.versions.length - 5} more`
											: '')
									);
								}

								return '';
							},
						},
					},
				},
				scales: {
					x: {
						beginAtZero: true,
						ticks: {
							callback: function (value) {
								return value.toLocaleString();
							},
						},
					},
				},
			},
		});

		const observer = new ResizeObserver(([resize]) => {
			if (resize) {
				chart.resize(resize.contentRect.width);
			}
		});

		observer.observe(node.parentElement!);

		return () => {
			chart.destroy();
			observer.disconnect();
		};
	}}
></canvas>
