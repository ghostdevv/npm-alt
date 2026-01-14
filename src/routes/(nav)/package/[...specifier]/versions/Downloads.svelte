<script lang="ts">
	import { startOfWeek, format } from 'date-fns';
	import { cache } from '$lib/client/cache';
	import {
		type ChartData,
		LineController,
		PointElement,
		LineElement,
		Tooltip,
		Chart,
		Filler,
	} from 'chart.js';

	Chart.register(LineController, LineElement, PointElement, Tooltip, Filler);

	interface DownloadsResponse {
		start: string;
		end: string;
		downloads: { day: string; downloads: number }[];
	}

	type WeeklyDownloads = { week: string; downloads: number }[];

	interface Props {
		name: string;
	}

	const { name }: Props = $props();

	const load = cache({
		version: 1,
		ttl: 300,
		async value(): Promise<ChartData<'line', number[], unknown>> {
			// prettier-ignore
			// prettier-ignore
			const res = await fetch(`https://api.npmjs.org/downloads/range/last-year/${name}`);
			const data = await res.json<DownloadsResponse>();

			const currentWeekStart = format(
				startOfWeek(new Date()),
				'yyyy-MM-dd',
			);

			const weeklyData: WeeklyDownloads = [];

			for (const entry of data.downloads) {
				const date = new Date(entry.day);
				const weekStart = startOfWeek(date);
				const week = format(weekStart, 'yyyy-MM-dd');

				// Exclude current week
				if (week === currentWeekStart) {
					continue;
				}

				const last = weeklyData.at(-1);
				if (!last || last.week !== week) {
					weeklyData.push({ week, downloads: entry.downloads });
				} else {
					last.downloads += entry.downloads;
				}
			}

			return {
				labels: weeklyData.map(({ week }) => week),
				datasets: [
					{
						label: 'Downloads',
						data: weeklyData.map((d) => d.downloads),
						borderColor: '#2160ec',
						backgroundColor: '#2160ec44',
						fill: 'start',
					},
				],
			};
		},
	});

	const data = $derived(await load(`downloads:${name}`));
</script>

<canvas
	{@attach (node) => {
		const chart = new Chart(node, {
			type: 'line',
			data,
			options: {
				responsive: true,
				elements: {
					line: {
						tension: 0.2,
					},
				},
			},
		});

		const observer = new ResizeObserver(([resize]) => {
			console.log('resize', resize);
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
