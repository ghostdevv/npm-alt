export interface SearchResponse {
	objects: Object[];
	total: number;
	time: string;
}

export interface Object {
	downloads: Downloads;
	dependents: any;
	updated: string;
	searchScore: number;
	package: SearchPackage;
	score: Score;
	flags: Flags;
}

interface Downloads {
	monthly: number;
	weekly: number;
}

export interface SearchPackage {
	name: string;
	keywords: string[];
	version: string;
	description?: string;
	sanitized_name: string;
	publisher: Publisher;
	maintainers: Maintainer[];
	license?: string;
	date: string;
	links: Links;
}

interface Publisher {
	email: string;
	username: string;
	trustedPublisher?: TrustedPublisher;
	actor?: Actor;
}

interface TrustedPublisher {
	oidcConfigId: string;
	id: string;
}

interface Actor {
	name: string;
	type: string;
	email: string;
}

interface Maintainer {
	email: string;
	username: string;
}

interface Links {
	homepage?: string;
	repository?: string;
	bugs?: string;
	npm: string;
}

interface Score {
	final: number;
	detail: Detail;
}

interface Detail {
	popularity: number;
	quality: number;
	maintenance: number;
}

interface Flags {
	insecure: number;
}
