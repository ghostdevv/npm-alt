use color_eyre::eyre::Result;
use color_eyre::eyre::eyre;
use reqwest::Client;
use serde::Deserialize;
use sqlx::PgPool;

use crate::utils;

#[derive(Deserialize, Debug)]
struct RowValue {
    rev: String,
}

#[derive(Deserialize, Debug)]
struct Row {
    id: String,
    key: String,
    value: RowValue,
}

#[derive(Deserialize, Debug)]
struct DocsResponse {
    total_rows: i64,
    // offset: i32,
    rows: Vec<Row>,
}

async fn data_exists(pool: &PgPool) -> Result<bool> {
    let record = sqlx::query!("SELECT EXISTS(SELECT 1 FROM packages LIMIT 1)")
        .fetch_one(pool)
        .await?;

    Ok(record.exists.unwrap_or(true))
}

pub async fn seed(pool: &PgPool) -> Result<()> {
    if data_exists(pool).await? {
        return Err(eyre!("data already exists in packages"));
    }

    let mut start_key: Option<String> = None;
    let client = Client::new();
    let mut count = 0;

    loop {
        let response = client
            .get(format!("{}/_all_docs", utils::REPLICATE_BASE_URL))
            .query(&[
                ("start_key", &start_key),
                ("limit", &Some(String::from("10000"))),
            ])
            .send()
            .await?
            .error_for_status()?
            .json::<DocsResponse>()
            .await?;

        if response.rows.len() == 1 {
            log::info!("seeding finished");
            break;
        }

        for row in response.rows.iter() {
            if let Some(start_key) = &start_key {
                if *start_key == row.key {
                    continue;
                }
            }

            if row.id != row.key {
                log::info!(
                    "found case where row.id != row.key ({:?}) {:?}",
                    start_key,
                    row
                )
            }

            count += 1;

            log::info!("{}/{} inserting {}", count, response.total_rows, row.id);

            sqlx::query!(
                "INSERT INTO packages (id, rev) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                row.id,
                row.value.rev
            )
            .execute(pool)
            .await?;
        }

        let last_key = response
            .rows
            .last()
            .ok_or_else(|| eyre!("failed to find last row"))?
            .key
            .to_owned();

        start_key = Some(format!("\"{}\"", last_key));
    }

    Ok(())
}
