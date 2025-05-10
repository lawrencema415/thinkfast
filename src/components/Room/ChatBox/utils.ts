/**
 * Normalize a string for fuzzy matching.
 */
const normalize = (str: string): string =>
  str
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')    // collapse whitespace
    .trim();

/**
 * Only return true if the guess matches the answer exactly (ignoring case/punctuation).
 */
export const fuzzyMatch = (guess: string, answer: string): boolean => {
  return normalize(guess) === normalize(answer);
};

/**
 * Calculate Levenshtein distance between two strings.
 */
const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, (_, i) =>
    Array.from({ length: a.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Determine if a guess is close to the correct answer using typo tolerance.
 */
export const isCloseMatch = (guess: string, answer: string): boolean => {
  const normalizedGuess = normalize(guess);
  const normalizedAnswer = normalize(answer);
  if (!normalizedGuess || !normalizedAnswer) return false;
  if (normalizedGuess === normalizedAnswer) return false; // already handled by fuzzyMatch
  return levenshteinDistance(normalizedGuess, normalizedAnswer) <= 2;
};
