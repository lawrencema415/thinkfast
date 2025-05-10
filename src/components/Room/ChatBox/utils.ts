/**
 * Normalize a string for fuzzy matching.
 */
const normalize = (str: string): string =>
  str.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Basic fuzzy match between guess and answer with optional threshold.
 */
export const fuzzyMatch = (guess: string, answer: string, threshold = 0.8): boolean => {
  const normalizedGuess = normalize(guess);
  const normalizedAnswer = normalize(answer);

  if (normalizedGuess === normalizedAnswer) return true;

  if (normalizedAnswer.includes(normalizedGuess) || normalizedGuess.includes(normalizedAnswer)) {
    const ratio = Math.min(normalizedGuess.length, normalizedAnswer.length) / 
                  Math.max(normalizedGuess.length, normalizedAnswer.length);
    return ratio >= threshold;
  }

  return false;
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
  const normalizedGuess = guess.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const normalizedAnswer = answer.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return levenshteinDistance(normalizedGuess, normalizedAnswer) <= 2;
};
