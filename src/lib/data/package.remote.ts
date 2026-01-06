import microUtils from 'module-replacements/manifests/micro-utilities.json' with { type: 'json' };
import preferred from 'module-replacements/manifests/preferred.json' with { type: 'json' };
import native from 'module-replacements/manifests/native.json' with { type: 'json' };
import type { ModuleReplacement } from 'module-replacements';
import type { ModReplacement, Package } from './types';
import { getInternalPackage } from './package.server';
import { getRequestEvent, query } from '$app/server';
import { packageTypeStatus } from './types.server';
import hostedGitInfo from 'hosted-git-info';
import * as ve from '../valibot';

const allModuleReplacements = [
	...microUtils.moduleReplacements,
	...native.moduleReplacements,
	...preferred.moduleReplacements,
] as ModuleReplacement[];

export const getPackage = query(
	ve.specifier,
	async (specifier): Promise<Package> => {
		const event = getRequestEvent();
		const pkg = await getInternalPackage(specifier, event.platform!);

		const repo = pkg.repoURL
			? hostedGitInfo.fromUrl(pkg.repoURL)
			: undefined;

		return {
			name: pkg.name,
			version: pkg.version,
			repo: repo
				? {
						link: repo.https({ noGitPlus: true }),
						assets: repo.file('/'),
						dir: pkg.repoDir,
					}
				: undefined,
			homepage: pkg.homepage,
			npm: `https://www.npmjs.com/package/${pkg.name}`,
			replacements: allModuleReplacements.filter(
				(m): m is ModReplacement =>
					m.type !== 'none' && m.moduleName === pkg.name,
			),
			types: await packageTypeStatus(pkg, event.platform!),
			deprecated: pkg.deprecated,
			license: pkg.license,
			unpackedSize: pkg.size,
			publishedAt: pkg.publishedAt,
			createdAt: pkg.createdAt,
			updatedAt: pkg.updatedAt,
		};
	},
);
