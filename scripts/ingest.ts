import { ingestAllFeeds } from "@/lib/news/ingest";

async function main() {
  const result = await ingestAllFeeds();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
