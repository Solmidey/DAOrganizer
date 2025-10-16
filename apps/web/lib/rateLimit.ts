const buckets = new Map<string, { count: number; reset: number }>();

export async function consume(key: string, limit = 5, windowSeconds = 60) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowSeconds * 1000 });
    return;
  }
  if (bucket.count >= limit) {
    throw new Error("Rate limit exceeded");
  }
  bucket.count += 1;
}
