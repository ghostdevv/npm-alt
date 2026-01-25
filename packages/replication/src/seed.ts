import { packumentTable } from './schema';
import { fetchPackument } from './fetch';
import { createState, db } from './db';
import { ofetch } from 'ofetch';

interface Row {
	id: string;
	key: string;
	value: {
		rev: string;
	};
}

interface DocsResponse {
	total_rows: number;
	offset: number;
	rows: Row[];
}

interface MetaResponse {
	doc_count: number;
	update_seq: number;
}

const dbSeedPickup = createState<MetaResponse>('seed-pickup');
const dbStartKey = createState<string>('seed-last-key');

async function handleRow(row: Row) {
	if (row.id !== row.key) {
		console.info('found case where row.id !== row.key', row);
	}

	let packument;

	try {
		packument = await fetchPackument(row.id);

		await db
			.insert(packumentTable)
			.values({ id: row.id, data: packument })
			.onConflictDoUpdate({
				target: packumentTable.id,
				set: { data: packument },
			});
	} catch (e) {
		const error =
			e instanceof Error
				? e
				: new Error('failed to handle row', { cause: e });

		if (error.message.includes('Invalid string length')) {
			console.log('weird string thing pak:', { packument });
		}

		error.message += ` (${row.id})`;
		throw error;
	}
}

function chunkArray<T>(array: T[], size: number): T[][] {
	const chunks: T[][] = [];

	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}

	return chunks;
}

async function seed() {
	const meta = await ofetch<MetaResponse>('/', {
		baseURL: 'https://replicate.npmjs.com',
		headers: {
			'User-Agent': `npm-alt (+https://github.com/ghostdevv/npm-alt)`,
		},
	});

	console.log(`Starting seed`, meta);
	await dbSeedPickup.set(meta);

	let startKey = await dbStartKey.get();
	let count = 0;

	while (true) {
		const response = await ofetch<DocsResponse>('/registry/_all_docs', {
			baseURL: 'https://replicate.npmjs.com',
			headers: {
				'User-Agent': `npm-alt (+https://github.com/ghostdevv/npm-alt)`,
			},
			query: {
				start_key: startKey ? JSON.stringify(startKey) : undefined,
				limit: 100,
			},
		});

		if (response.rows.length === 1) {
			console.log('seeding finished!');
			break;
		}

		for (const chunk of chunkArray(response.rows, 15)) {
			console.log(
				`Processing: ${count}/${response.total_rows - response.offset}`,
			);

			count += chunk.length;

			const results = await Promise.allSettled(
				chunk.map(async (row) => {
					if (row.key === startKey) {
						return null;
					}

					await handleRow(row);
				}),
			);

			const errors = results.filter(
				(result) => result.status === 'rejected',
			);

			if (errors.length > 0) {
				console.log('Errors occurred during processing', errors);
				process.exit(1);
			}
		}

		startKey = response.rows.at(-1)?.key!;
		await dbStartKey.set(startKey);
	}
}

await seed();
