import type { OpenNextConfig } from "@opennextjs/aws/types/open-next";

const config = {
  default: {
    override: {
      queue: "direct"
    }
  }
} satisfies OpenNextConfig;

export default config;
