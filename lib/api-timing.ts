import { performance } from "node:perf_hooks";

type TimingMeta = Record<string, string | number | boolean | null | undefined>;

const isTimingEnabled = process.env.PERF_API_TIMING === "true";

export function createApiTimer(route: string) {
  const startedAt = performance.now();

  const log = (event: string, elapsedMs: number, meta?: TimingMeta) => {
    if (!isTimingEnabled) {
      return;
    }

    const payload = {
      route,
      event,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      ...(meta ?? {}),
    };

    console.info(`[api-timing] ${JSON.stringify(payload)}`);
  };

  return {
    mark(event: string, meta?: TimingMeta) {
      log(event, performance.now() - startedAt, meta);
    },
    end(meta?: TimingMeta) {
      log("end", performance.now() - startedAt, meta);
    },
  };
}
