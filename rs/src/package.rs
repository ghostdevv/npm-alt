use chrono::{DateTime, Utc};
use color_eyre::eyre::{OptionExt, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::{
    packument::{self, get_packument},
    utils,
};

#[derive(Debug, Serialize, Deserialize)]
pub enum FundingKind {
    Patreon,
    Individual,
    OpenCollective,
}

impl TryFrom<&str> for FundingKind {
    type Error = color_eyre::Report;

    fn try_from(value: &str) -> std::result::Result<Self, Self::Error> {
        match value {
            "patreon" => Ok(FundingKind::Patreon),
            "individual" => Ok(FundingKind::Individual),
            "opencollective" => Ok(FundingKind::OpenCollective),
            _ => Err(color_eyre::eyre::eyre!("Invalid funding kind")),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Funding {
    pub kind: Option<FundingKind>,
    pub url: String,
}

impl TryFrom<packument::FundingStructOrString> for Funding {
    type Error = color_eyre::Report;

    fn try_from(value: packument::FundingStructOrString) -> std::result::Result<Self, Self::Error> {
        match value {
            packument::FundingStructOrString::Funding(obj) => Ok(Funding {
                kind: obj
                    .kind
                    .map(|kind| FundingKind::try_from(kind.as_str()))
                    .transpose()
                    .unwrap_or(None),
                url: utils::check_url(&obj.url)?,
            }),
            packument::FundingStructOrString::Str(str) => Ok(Funding {
                kind: None,
                url: utils::check_url(&str)?,
            }),
        }
    }
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub enum DependencyKind {
    Prod,
    Dev,
    Peer,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Dependency {
    pub kind: DependencyKind,
    pub name: String,
    pub version: String, // todo rename
    pub optional: bool,
    pub registry: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PackageVersion {
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub repo_url: Option<String>,
    pub repo_dir: Option<String>,
    pub homepage: Option<String>,
    pub deprecated: Option<String>,
    pub license: Option<String>,
    pub size: Option<u64>,
    pub funding: Option<Vec<Funding>>,
    pub dependencies: Vec<Dependency>,
    pub published_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Package {
    pub name: String,
    pub versions: Vec<PackageVersion>,
    pub dist_tags: HashMap<String, String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl TryFrom<packument::Packument> for Package {
    type Error = color_eyre::Report;

    fn try_from(value: packument::Packument) -> std::result::Result<Package, Self::Error> {
        let mut versions = Vec::new();

        for (_, pkv) in value.versions.into_iter() {
            let published_at = *value
                .time
                .get(&pkv.version)
                .ok_or_eyre("failed to get package version published at")?;

            let funding: Result<Option<Vec<Funding>>> = match pkv.funding {
                Some(packument::PackumentVersionFundingField::Multiple(vec)) => {
                    let mut funding = vec![];

                    for field in vec {
                        funding.push(Funding::try_from(field)?);
                    }

                    Ok(Some(funding))
                }
                Some(packument::PackumentVersionFundingField::Single(field)) => {
                    Ok(Some(vec![Funding::try_from(field)?]))
                }
                None => Ok(None),
            };

            let mut deps = vec![];

            // Production dependencies (excluding those also declared as optional)
            if let Some(dependencies) = pkv.dependencies {
                for (name, version) in dependencies {
                    if let Some(optional_deps) = &pkv.optional_dependencies {
                        if optional_deps.contains_key(&name) {
                            continue;
                        }
                    }

                    deps.push(Dependency {
                        name,
                        version,
                        kind: DependencyKind::Prod,
                        optional: false,
                        registry: true,
                    });
                }
            }

            // Optional dependencies (always marked optional)
            if let Some(optional_dependencies) = pkv.optional_dependencies {
                for (name, version) in optional_dependencies {
                    deps.push(Dependency {
                        name,
                        version,
                        kind: DependencyKind::Prod,
                        optional: false,
                        registry: true,
                    });
                }
            }

            // Development dependencies (always marked optional)
            if let Some(dev_dependencies) = pkv.dev_dependencies {
                for (name, version) in dev_dependencies {
                    deps.push(Dependency {
                        name,
                        version,
                        kind: DependencyKind::Dev,
                        optional: false,
                        registry: true,
                    });
                }
            }

            // Peer dependencies
            if let Some(peer_dependencies) = pkv.peer_dependencies {
                for (name, version) in peer_dependencies {
                    let optional = if let Some(peer_meta) = &pkv.peer_dependencies_meta {
                        peer_meta
                            .get(&name)
                            .map_or(false, |meta| meta.optional.unwrap_or(false))
                    } else {
                        false
                    };

                    deps.push(Dependency {
                        name,
                        version,
                        kind: DependencyKind::Peer,
                        optional,
                        registry: true,
                    });
                }
            }

            versions.push(PackageVersion {
                name: pkv.name,
                version: pkv.version,
                description: pkv.description,
                repo_url: None, // todo
                repo_dir: None, // todo
                homepage: pkv.homepage,
                license: pkv.license,
                deprecated: pkv.deprecated,
                funding: funding?,
                size: pkv.dist.unpacked_size,
                dependencies: deps,
                published_at,
            });
        }

        Ok(Package {
            name: value.name,
            versions,
            dist_tags: value.dist_tags,
            created_at: *value
                .time
                .get("created")
                .ok_or_eyre("failed to get created at on packument")?,
            updated_at: *value
                .time
                .get("modified")
                .ok_or_eyre("failed to get modified at on packument")?,
        })
    }
}

pub async fn get_package(name: &str) -> Result<Option<Package>> {
    match get_packument(name).await {
        Ok(Some(pkg)) => Ok(Some(Package::try_from(pkg)?)),
        Ok(None) => Ok(None),
        Err(err) => Err(err),
    }
}
