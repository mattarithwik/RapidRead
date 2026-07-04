const buckets = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(key: string, max: number, windowMs = 60_000): Promise<boolean> {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}
