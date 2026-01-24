use chrono::{DateTime, Utc};
use color_eyre::eyre::Result;
use reqwest::{Client, StatusCode};
use serde::Deserialize;
use std::collections::HashMap;

use crate::utils;

#[derive(Debug, Deserialize)]
pub struct FundingStruct {
    #[serde(rename = "type")]
    pub kind: Option<String>,
    pub url: String,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum FundingStructOrString {
    Funding(FundingStruct),
    Str(String),
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum PackumentVersionFundingField {
    Single(FundingStructOrString),
    Multiple(Vec<FundingStructOrString>),
}

#[derive(Debug, Deserialize)]
pub struct Dist {
    #[serde(rename = "unpackedSize")]
    pub unpacked_size: Option<u64>,
}

#[derive(Debug, Deserialize)]
pub struct PeerDependenciesMeta {
    pub optional: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct PackumentVersion {
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub homepage: Option<String>,
    pub deprecated: Option<String>,
    pub license: Option<String>,
    pub dist: Dist,
    pub funding: Option<PackumentVersionFundingField>,
    pub dependencies: Option<HashMap<String, String>>,
    #[serde(rename = "devDependencies")]
    pub dev_dependencies: Option<HashMap<String, String>>,
    #[serde(rename = "optionalDependencies")]
    pub optional_dependencies: Option<HashMap<String, String>>,
    #[serde(rename = "peerDependencies")]
    pub peer_dependencies: Option<HashMap<String, String>>,
    #[serde(rename = "peerDependenciesMeta")]
    pub peer_dependencies_meta: Option<HashMap<String, PeerDependenciesMeta>>,
}

#[derive(Debug, Deserialize)]
pub struct Packument {
    pub name: String,
    pub versions: HashMap<String, PackumentVersion>,
    #[serde(rename = "dist-tags")]
    pub dist_tags: HashMap<String, String>,
    pub time: HashMap<String, DateTime<Utc>>,
}

pub async fn get_packument(name: &str) -> Result<Option<Packument>> {
    let response = Client::new()
        .get(format!("{}/{}", utils::REGISTRY_BASE_URL, name))
        .send()
        .await?
        .error_for_status();

    match response {
        Ok(response) => Ok(Some(response.json::<Packument>().await?)),
        Err(err) if err.status() == Some(StatusCode::NOT_FOUND) => Ok(None),
        Err(err) => Err(err.into()),
    }
}
