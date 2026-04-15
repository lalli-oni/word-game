export function calculateObscurity(rank: number): number {
  if (rank <= 1000) return 0;
  if (rank <= 5000) return 1;
  if (rank <= 10000) return 2;
  if (rank <= 20000) return 3;
  if (rank <= 30000) return 4;
  if (rank <= 40000) return 5;
  if (rank <= 50000) return 6;
  if (rank <= 60000) return 7;
  if (rank <= 70000) return 8;
  if (rank <= 80000) return 9;
  return 10;
}

export function getObscurityColor(val: number) {
	if (val <= 1) return 'text-emerald-400';
	if (val <= 3) return 'text-blue-400';
	if (val <= 6) return 'text-purple-400';
	return 'text-pink-400';
}

export function getObscurityLabel(val: number) {
  if (val <= 1) return 'Common';
  if (val <= 3) return 'Typical';
  if (val <= 6) return 'Rare';
  return 'Obscure';
}

export function isAnagram(w1: string, w2: string): boolean {
  if (w1.length !== w2.length || w1.toUpperCase() === w2.toUpperCase()) return false;
  return w1.toUpperCase().split('').sort().join('') === w2.toUpperCase().split('').sort().join('');
}

export function getLetterDifferences(w1: string, w2: string): number {
  if (w1.length !== w2.length) return -1;
  let diffs = 0;
  for (let i = 0; i < w1.length; i++) {
    if (w1[i].toUpperCase() !== w2[i].toUpperCase()) diffs++;
  }
  return diffs;
}

export function isOneLetterDifferent(w1: string, w2: string): boolean {
  return getLetterDifferences(w1, w2) === 1;
}
