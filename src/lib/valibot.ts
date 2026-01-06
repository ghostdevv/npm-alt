import validatePackageName from 'validate-npm-package-name';
import parsePackage from 'npm-package-arg';
import * as v from 'valibot';
import semv from 'semver';

// todo validate username chars
export const username = v.pipe(v.string(), v.minLength(1));

export const packageName = v.pipe(
	v.string('must be a string'),
	v.minLength(1, 'should be at least one character long'),
	v.rawTransform(({ dataset, addIssue, NEVER }) => {
		const result = validatePackageName(dataset.value);
		if (result.validForOldPackages) return dataset.value;

		for (const message of result.errors.concat(result.warnings || [])) {
			addIssue({ message });
		}

		return NEVER;
	}),
);

export const semver = v.pipe(
	v.string('semver must be a string'),
	v.transform((semver) => semv.valid(semver)),
	v.string('semver failed to be parsed'),
);

export const specifier = v.pipe(
	v.string('specifier must be a string'),
	v.minLength(1, 'specifier should be at least one character long'),
	v.rawTransform(({ dataset, addIssue, NEVER }) => {
		try {
			const result = parsePackage(dataset.value);

			return {
				type: result.type,
				name: result.name,
				fetchSpec: result.fetchSpec,
			};
		} catch (error) {
			addIssue({ message: 'invalid specifier' });
			return NEVER;
		}
	}),
	v.object({
		type: v.union(
			[v.literal('tag'), v.literal('version'), v.literal('range')],
			'specifier type must be range, tag, or version',
		),
		name: packageName,
		fetchSpec: v.string(),
	}),
);

export type Specifier = v.InferOutput<typeof specifier>;
