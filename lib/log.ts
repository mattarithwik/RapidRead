import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(process.env.NODE_ENV !== "production"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true }
        }
      }
    : {})
});

export function emitMetric(name: string, value: number, unit: "Count" | "Milliseconds" = "Count") {
  if (process.env.NODE_ENV === "production") {
    console.log(
      JSON.stringify({
        _aws: {
          Timestamp: Date.now(),
          CloudWatchMetrics: [
            {
              Namespace: "RapidRead",
              Dimensions: [["Service"]],
              Metrics: [{ Name: name, Unit: unit }]
            }
          ]
        },
        Service: "rapidread",
        [name]: value
      })
    );
  }
}
