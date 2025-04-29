import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes conditionally.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/**
 * Generate a random uppercase alphanumeric string of given length.
 */
export const generateRandomString = (length: number): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
};

/**
 * Format seconds to "MM:SS" string.
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Calculate score based on how quickly the user guessed.
 */
export const calculateScore = (timeElapsed: number, totalTime: number): number => {
  const speedRatio = 1 - (timeElapsed / totalTime);
  const speedBonus = Math.round(speedRatio * 50);
  return 50 + speedBonus;
};

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
 * Get the initials from a user's name.
 */
export const getInitials = (name: string): string =>
  name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);

/**
 * Assign a consistent color class to a username.
 */
export const getUserColor = (username: string): string => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];

  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
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
