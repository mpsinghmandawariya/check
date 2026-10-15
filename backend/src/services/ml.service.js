const base = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
async function request(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const r = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!r.ok) {
      const e = new Error(`ML service returned ${r.status}`);
      e.status = 502;
      throw e;
    }
    return await r.json();
  } catch (e) {
    if (e.status) throw e;
    const err = new Error(
      e.name === "AbortError"
        ? "ML service timed out"
        : "Python ML service is unavailable",
    );
    err.status = 503;
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
async function analyzeText(text) {
  return request("/analyze", { text });
}
async function checkMLHealth() {
  const r = await fetch(`${base}/health`, {
    signal: AbortSignal.timeout(2500),
  });
  if (!r.ok) throw new Error("ML service unhealthy");
  return r.json();
}
module.exports = { analyzeText, checkMLHealth };
