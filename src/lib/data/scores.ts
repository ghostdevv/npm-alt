interface Criterion {
	id: string;
	name: string;
	description: string;
	max: number;
}

export type CriteriaId = (typeof SCORE_CRITERIA)[number]['id'];

export const SCORE_CRITERIA = Object.freeze([
	{
		id: 'readme',
		name: 'Has a readme',
		description: 'A README.md file is present in the root of the package.',
		max: 1,
	},
	{
		id: 'changelog',
		name: 'Has a changelog',
		description:
			'A changelog was found in the package. If the changelog was uploaded to npm, then an additional point is awarded.',
		max: 2,
	},
	{
		id: 'types',
		name: 'Has type definitions',
		description:
			"Type definitions were found natively in the package, definitely typed doesn't count.",
		max: 1,
		// state: data.pkg.types.status === 'built-in' ? 'met' : 'not-met',
	},
	{
		id: 'license',
		name: 'Has a license',
		description: 'The package provides a license',
		max: 1,
	},
	// {
	// 	id: 'provenance',
	// 	name: 'Has provenance',
	// 	description: 'The package has a provenance.',
	// 	max: 1,
	// },
] as const) satisfies readonly Criterion[];
