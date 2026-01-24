use clap::Parser;
use color_eyre::eyre::Result;
use color_eyre::eyre::eyre;
use futures_util::StreamExt;
use futures_util::pin_mut;
use sqlx::PgPool;

use crate::changes::changes_stream;
use crate::utils;

#[derive(Parser, Debug)]
pub struct Args {
    #[arg(
        long,
        help = "If the last seq is not found, allow starting from the beginning"
    )]
    force_start: bool,
}

pub async fn watch(pool: &PgPool, args: Args) -> Result<()> {
    let last_seq = utils::get_last_seq(pool).await?;

    if last_seq.is_none() {
        if args.force_start {
            log::info!("starting from beginning");
        } else {
            return Err(eyre!(
                "last sequence not found, run seed or use --force-start"
            ));
        }
    }

    let stream = changes_stream(pool, last_seq);
    pin_mut!(stream);

    while let Some(change) = stream.next().await {
        match change {
            Ok(change) => {
                log::info!(
                    "{} {} ({:?})",
                    if change.deleted { "deleted" } else { "updated" },
                    change.id,
                    change.changes.iter().map(|change| &change.rev),
                );

                if change.deleted {
                    sqlx::query!("DELETE FROM packages WHERE id = $1", change.id)
                        .execute(pool)
                        .await?;
                } else {
                    if change.changes.len() != 1 {
                        panic!("changes issue found for package {:#?}", change);
                    }

                    sqlx::query!(
                        "INSERT INTO packages (id, rev) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                        change.id,
                        change.changes[0].rev
                    )
                    .execute(pool)
                    .await?;
                }
            }
            Err(error) => {
                log::error!("error fetching changes: {}", error);
            }
        }
    }

    Ok(())
}
