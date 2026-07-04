export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function cosineSimilarity(a?: number[], b?: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    magA += a[index] ** 2;
    magB += b[index] ** 2;
  }
  if (!magA || !magB) return 0;
  return clamp01((dot / (Math.sqrt(magA) * Math.sqrt(magB)) + 1) / 2);
}

export function averageVectors(vectors: number[][]): number[] | undefined {
  if (!vectors.length) return undefined;
  const length = vectors[0].length;
  if (!vectors.every((vector) => vector.length === length)) return undefined;
  return vectors[0].map((_, index) => {
    const sum = vectors.reduce((total, vector) => total + vector[index], 0);
    return sum / vectors.length;
  });
}

export function weightedAverageVectors(
  entries: { vector: number[]; weight: number }[]
): number[] | undefined {
  if (!entries.length) return undefined;
  const length = entries[0].vector.length;
  let totalWeight = 0;
  const sums = new Array<number>(length).fill(0);

  for (const entry of entries) {
    if (entry.vector.length !== length || entry.weight <= 0) continue;
    totalWeight += entry.weight;
    entry.vector.forEach((value, index) => {
      sums[index] += value * entry.weight;
    });
  }

  if (!totalWeight) return undefined;
  return sums.map((value) => value / totalWeight);
}
