import { performance } from "perf_hooks";

const targetUrl = process.env.STRESS_TARGET_URL || "http://127.0.0.1:3000/api/config";
const totalRequests = Number(process.env.STRESS_REQUESTS || 100);
const concurrency = Number(process.env.STRESS_CONCURRENCY || 20);
const botToken = process.env.STRESS_BOT_TOKEN || "stress-test-token";
const telegramId = process.env.STRESS_TELEGRAM_ID || "123456789";

function chunkWork(total, width) {
  const chunks = [];
  let index = 0;

  while (index < total) {
    chunks.push(index);
    index += width;
  }

  return chunks;
}

async function sendOne(requestNumber) {
  const startedAt = performance.now();

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        botToken,
        telegramId,
      }),
    });

    const elapsedMs = performance.now() - startedAt;
    const text = await response.text();

    return {
      requestNumber,
      ok: response.ok,
      status: response.status,
      elapsedMs,
      body: text,
    };
  } catch (error) {
    return {
      requestNumber,
      ok: false,
      status: 0,
      elapsedMs: performance.now() - startedAt,
      body: error.message,
    };
  }
}

async function main() {
  const startedAt = performance.now();
  const results = [];

  for (const start of chunkWork(totalRequests, concurrency)) {
    const batchSize = Math.min(concurrency, totalRequests - start);
    const batch = Array.from({ length: batchSize }, (_, offset) =>
      sendOne(start + offset + 1),
    );
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  const totalElapsedMs = performance.now() - startedAt;
  const succeeded = results.filter((result) => result.ok);
  const failed = results.filter((result) => !result.ok);
  const latencies = results
    .map((result) => result.elapsedMs)
    .sort((a, b) => a - b);

  const percentile = (p) => {
    if (latencies.length === 0) {
      return 0;
    }
    const index = Math.min(
      latencies.length - 1,
      Math.ceil((p / 100) * latencies.length) - 1,
    );
    return latencies[index];
  };

  console.log(`Target: ${targetUrl}`);
  console.log(`Requests: ${totalRequests}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Succeeded: ${succeeded.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Total time: ${totalElapsedMs.toFixed(2)} ms`);
  console.log(
    `Throughput: ${(totalRequests / (totalElapsedMs / 1000)).toFixed(2)} req/s`,
  );
  console.log(`p50: ${percentile(50).toFixed(2)} ms`);
  console.log(`p95: ${percentile(95).toFixed(2)} ms`);
  console.log(`p99: ${percentile(99).toFixed(2)} ms`);

  if (failed.length > 0) {
    console.log("Sample failures:");
    for (const failure of failed.slice(0, 5)) {
      console.log(
        `#${failure.requestNumber} status=${failure.status} body=${failure.body}`,
      );
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
