use clap::Parser;
use color_eyre::eyre::Result;
use std::time::SystemTime;

mod changes;
mod package;
mod packument;
mod seed;
mod utils;
mod watch;

#[derive(Parser, Debug)]
struct GetPackumentArgs {
    name: String,
}

#[derive(Parser, Debug)]
enum Command {
    Watch(watch::Args),
    Seed,
    GetPackument(GetPackumentArgs),
}

#[derive(Parser, Debug)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

async fn graph_it(graph: &neo4rs::Graph, name: &str) -> Result<()> {
    match package::get_package(&name).await {
        Ok(Some(pkg)) => {
            graph
                .run(
                    neo4rs::query("MERGE (pkg:Package {name: $name})")
                        .param("name", pkg.name.clone()),
                )
                .await?;

            for pkv in pkg.versions {
                let name = format!("{}@{}", pkv.name, pkv.version);

                graph
                    .run(
                        neo4rs::query("MERGE (pkv:PackageVersion {name: $name})")
                            .param("name", name.clone()),
                    )
                    .await?;

                graph
                    .run(
                        neo4rs::query(
                            r#"
                            MATCH (pkg:Package {name: $pkg_name})
                            MATCH (pkv:PackageVersion {name: $pkv_name})
                            MERGE (pkg)-[:VERSION]->(pkv)
                        "#,
                        )
                        .param("pkg_name", pkg.name.clone())
                        .param("pkv_name", name.clone()),
                    )
                    .await?;

                for dep in pkv.dependencies {
                    if dep.kind == package::DependencyKind::Prod && !dep.optional {
                        let exists = graph
                            .execute(
                                neo4rs::query("MATCH (pkg:Package {name: $name}) RETURN pkg.id")
                                    .param("name", dep.name.clone()),
                            )
                            .await?
                            .next()
                            .await?
                            .is_some();

                        if exists {
                            log::info!("skippin' {}", name);
                            continue;
                        }

                        Box::pin(graph_it(&graph, &dep.name)).await?;

                        graph
                            .run(
                                neo4rs::query(
                                    r#"
                                    MATCH (pkv:PackageVersion {name: $pkv_name})
                                    MATCH (dep:Package {name: $dep_name})
                                    MERGE (pkv)-[:DEPENDS_ON]->(dep)
                                "#,
                                )
                                .param("pkv_name", name.clone())
                                .param("dep_name", dep.name.clone()),
                            )
                            .await?;
                    }
                }
            }
        }
        Ok(None) => {
            println!("package not found!");
        },
        Err(err) => {
            println!("failed to fetch for {}", name);
            println!("{:#?}", err);
        }
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    fern::Dispatch::new()
        .format(|out, message, record| {
            out.finish(format_args!(
                "[{} {} {}] {}",
                humantime::format_rfc3339_seconds(SystemTime::now()),
                record.level(),
                record.target(),
                message
            ))
        })
        .level(log::LevelFilter::Info)
        .chain(std::io::stdout())
        .apply()?;

    let args = Cli::parse();

    match args.command {
        Command::Watch(args) => {
            let pool = utils::get_db_pool().await?;
            watch::watch(&pool, args).await?;
        }
        Command::Seed => {
            let pool = utils::get_db_pool().await?;
            seed::seed(&pool).await?;
        }
        Command::GetPackument(args) => {
            let graph = neo4rs::Graph::new(
                "127.0.0.1:7687",
                "neo4j",
                "garcia-sister-oliver-frog-lava-6346",
            )
            .await?;

            graph_it(&graph, &args.name).await?;
        }
    }

    Ok(())
}
