use async_stream::stream;
use color_eyre::eyre::Result;
use futures_util::Stream;
use reqwest::Client;
use serde::Deserialize;
use std::time::Duration;

use crate::utils;

/// Number of changes to fetch per request
const CHANGES_LIMIT: usize = 1000;

/// Delay when caught up (small number of results)
const POLL_DELAY_SECS: u64 = 60;

#[derive(Debug, Deserialize, Clone)]
pub struct Change {
    pub rev: String,
}

/// Helper function to provide default `false` value for deleted field.
fn default_false() -> bool {
    false
}

#[derive(Debug, Deserialize, Clone)]
pub struct ChangeResult {
    pub seq: i64,
    pub id: String,
    pub changes: Vec<Change>,
    #[serde(default = "default_false")]
    pub deleted: bool,
}

#[derive(Debug, Deserialize)]
pub struct ChangesResponse {
    pub results: Vec<ChangeResult>,
}

async fn fetch_changes(client: &Client, from_seq: i64) -> Result<Vec<ChangeResult>> {
    let response = client
        .get(format!("{}/_changes", utils::REPLICATE_BASE_URL))
        .query(&[
            ("since", from_seq.to_string()),
            ("limit", CHANGES_LIMIT.to_string()),
        ])
        .send()
        .await?
        .error_for_status()?
        .json::<ChangesResponse>()
        .await?;

    Ok(response.results)
}

pub fn changes_stream(
    pool: &sqlx::PgPool,
    since: Option<i64>,
) -> impl Stream<Item = Result<ChangeResult>> {
    stream! {
        let client = Client::new();
        let mut seq = since.unwrap_or(0);
        let mut backoff = Duration::from_secs(1);
        let max_backoff = Duration::from_secs(30);

        loop {
            match fetch_changes(&client, seq).await {
                Ok(changes) => {
                    // Reset backoff on success.
                    backoff = Duration::from_secs(1);

                    let num_changes = changes.len();

                    // Yield each change individually.
                    for change in changes {
                        seq = change.seq;
                        yield Ok(change);
                    }

                    utils::set_last_seq(pool, seq).await?;

                    // If we got fewer results than the limit, we're caught up.
                    // Sleep before polling again to avoid hammering the API.
                    if num_changes < CHANGES_LIMIT {
                        tokio::time::sleep(Duration::from_secs(POLL_DELAY_SECS)).await;
                    }
                }
                Err(e) => {
                    yield Err(e);

                    // Apply exponential backoff.
                    tokio::time::sleep(backoff).await;
                    backoff = (backoff * 2).min(max_backoff);
                }
            }
        }
    }
}
