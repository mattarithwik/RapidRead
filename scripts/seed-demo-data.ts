import { resetStore } from "@/lib/storage/localStore";
import { seedSnapshot } from "@/lib/seed";

async function main() {
  await resetStore(seedSnapshot);
  console.log(`Seeded ${seedSnapshot.articles.length} articles for ${seedSnapshot.profiles.length} demo profile.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
