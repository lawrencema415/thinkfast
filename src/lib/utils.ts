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
