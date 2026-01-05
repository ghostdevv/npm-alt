import microUtils from 'module-replacements/manifests/micro-utilities.json' with { type: 'json' };
import preferred from 'module-replacements/manifests/preferred.json' with { type: 'json' };
import native from 'module-replacements/manifests/native.json' with { type: 'json' };
import type { ModuleReplacement } from 'module-replacements';

export const allModuleReplacements = [
	...microUtils.moduleReplacements,
	...native.moduleReplacements,
	...preferred.moduleReplacements,
] as ModuleReplacement[];
