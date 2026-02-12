import type { Manifest } from './manifest';
import { USER_AGENT } from './common';
import { ofetch } from 'ofetch';
import * as v from 'valibot';

// todo verify provenance
// todo see how trusted publisher plays into it
// todo trust change warnings

interface Attestation {
	predicateType: string;
	bundle: Bundle;
	signedAccessSignatureUrl: string;
}

interface Bundle {
	mediaType: string;
	verificationMaterial: VerificationMaterial;
	dsseEnvelope: DsseEnvelope;
}

interface VerificationMaterial {
	publicKey?: PublicKey;
	tlogEntries: TlogEntry[];
	timestampVerificationData: TimestampVerificationData;
	certificate?: Certificate;
}

interface PublicKey {
	hint: string;
}

interface TlogEntry {
	logIndex: string;
	logId: LogId;
	kindVersion: KindVersion;
	integratedTime: string;
	inclusionPromise: InclusionPromise;
	inclusionProof: InclusionProof;
	canonicalizedBody: string;
}

interface LogId {
	keyId: string;
}

interface KindVersion {
	kind: string;
	version: string;
}

interface InclusionPromise {
	signedEntryTimestamp: string;
}

interface InclusionProof {
	logIndex: string;
	rootHash: string;
	treeSize: string;
	hashes: string[];
	checkpoint: Checkpoint;
}

interface Checkpoint {
	envelope: string;
}

interface TimestampVerificationData {
	rfc3161Timestamps: any[];
}

interface Certificate {
	rawBytes: string;
}

interface DsseEnvelope {
	payload: string;
	payloadType: string;
	signatures: Signature[];
}

interface Signature {
	sig: string;
	keyid: string;
}

interface AttestationResponse {
	attestations: Attestation[];
}

const statementSubjectSchema = v.pipe(
	v.array(
		v.object({
			name: v.string(),
			digest: v.object({
				sha512: v.string(),
			}),
		}),
	),
	v.minLength(1),
);

const publishStatementSchema = v.object({
	_type: v.literal('https://in-toto.io/Statement/v0.1'),
	subject: statementSubjectSchema,
	predicateType: v.literal(
		'https://github.com/npm/attestation/tree/main/specs/publish/v0.1',
	),
	// predicate: v.object({
	// 	name: v.string(),
	// 	version: v.string(),
	// 	registry: v.string(),
	// }),
});

const provenanceStatementResourceDescriptorSchema = v.optional(
	v.array(
		v.object({
			uri: v.string(),
			digest: v.object({
				sha256: v.string(),
				sha512: v.string(),
				gitCommit: v.string(),
				// [string]: string,
			}),
			name: v.string(),
			downloadLocation: v.string(),
			mediaType: v.string(),
			// "content": bytes, // base64-encoded
			// "annotations": {
			//     [string]: _  // any JSON type
			// }
		}),
	),
);

const provenanceStatementSchema = v.object({
	_type: v.literal('https://in-toto.io/Statement/v1'),
	subject: statementSubjectSchema,
	predicateType: v.literal('https://slsa.dev/provenance/v1'),
	predicate: v.object({
		buildDefinition: v.object({
			buildType: v.string(),
			externalParameters: v.object({
				workflow: v.object({
					ref: v.string(),
					repository: v.pipe(v.string(), v.url()),
					path: v.string(),
				}),
			}),
			internalParameters: v.optional(
				v.object({
					github: v.optional(
						v.object({
							event_name: v.string(),
							repository_id: v.string(),
							repository_owner_id: v.string(),
						}),
					),
					gitlab: v.optional(
						v.object({
							event_name: v.string(),
							repository_id: v.string(),
							repository_owner_id: v.string(),
						}),
					),
				}),
			),
			resolvedDependencies: provenanceStatementResourceDescriptorSchema,
		}),
		runDetails: v.object({
			builder: v.object({
				id: v.string(),
				builderDependencies:
					provenanceStatementResourceDescriptorSchema,
			}),
			metadata: v.optional(
				v.object({
					invocationId: v.string(),
				}),
			),
			byproducts: provenanceStatementResourceDescriptorSchema,
		}),
	}),
});

const statementSchema = v.union([
	provenanceStatementSchema,
	publishStatementSchema,
]);

export async function checkAttestation(manifest: Manifest) {
	const attestationUrl = manifest.dist.attestations?.url;
	if (!attestationUrl || !URL.canParse(attestationUrl)) return;

	const res = await ofetch<AttestationResponse>(
		new URL(attestationUrl).pathname,
		{
			baseURL: 'https://registry.npmjs.org',
			headers: {
				'User-Agent': USER_AGENT,
				Accept: 'application/json',
			},
		},
	);

	const envelopes = res.attestations.map(({ bundle }) => {
		const binary = atob(bundle.dsseEnvelope.payload);
		const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
		const str = new TextDecoder().decode(bytes);
		const statement = v.safeParse(statementSchema, JSON.parse(str));

		if (!statement.success) {
			console.error(
				`failed to parse statement for ${manifest.name}@${manifest.version}`,
				str,
			);

			throw new Error(
				'failed to parse provenance, let us know on the GitHub',
			);
		}

		return {
			signature: bundle.dsseEnvelope.signatures.at(0),
			statement: statement.output,
		};
	});

	// const attestationKeyIds = envelopes
	// 	.map((b) => b.keyId)
	// 	.filter((key) => !!key);

	// const attestationRegistryKeys =

	for (const {} of envelopes) {
	}
}
