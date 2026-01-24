use color_eyre::eyre::{Result, eyre};
use sqlx::PgPool;

/// npm registry replication base url
pub const REPLICATE_BASE_URL: &str = "https://replicate.npmjs.com/registry";

/// npm registry base url
pub const REGISTRY_BASE_URL: &str = "https://registry.npmjs.org";

pub async fn get_last_seq(pool: &PgPool) -> Result<Option<i64>> {
    let result = sqlx::query!(r#"SELECT value as "value: i64" FROM state WHERE key = 'last_seq'"#)
        .fetch_optional(pool)
        .await?
        .and_then(|r| Some(r.value));

    Ok(result)
}

pub async fn set_last_seq(pool: &PgPool, seq: i64) -> Result<()> {
    sqlx::query!(
        r#"
            INSERT INTO state (key, value)
            VALUES ('last_seq', $1)
            ON CONFLICT (key) DO
                UPDATE SET value = $1"#,
        seq.to_string()
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn get_db_pool() -> Result<PgPool> {
    let pool = PgPool::connect(&dotenvy::var("DATABASE_URL")?).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}

pub fn check_url(raw: &str) -> Result<String> {
    let mut url = reqwest::Url::parse(raw)?;

    if url.scheme() != "http" && url.scheme() != "https" {
        return Err(color_eyre::eyre::eyre!("Invalid URL scheme"));
    }

    url.set_scheme("https")
        .map_err(|e| eyre!("failed to set url scheme {:?}", e))?;

    Ok(url.to_string())
}
