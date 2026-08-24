export function cosine(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let la = 0;
  let lb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    la += a[i] * a[i];
    lb += b[i] * b[i];
  }
  la = Math.sqrt(la);
  lb = Math.sqrt(lb);
  if (la === 0 || lb === 0) return 0;
  return dot / (la * lb);
}
