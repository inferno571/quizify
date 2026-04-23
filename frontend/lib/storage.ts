import { Quiz, QuizAttempt } from "./types";

const LOCAL_STORAGE_QUIZZES_KEY = 'nptel_quizzes';
const LOCAL_STORAGE_ATTEMPTS_KEY = 'nptel_attempts';

export function getQuizzes(): Quiz[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_QUIZZES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Could not load quizzes from localStorage", e);
    return [];
  }
}

export function saveQuizzes(quizzes: Quiz[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_QUIZZES_KEY, JSON.stringify(quizzes));
  } catch (e) {
    console.error("Could not save quizzes to localStorage", e);
  }
}

export function getAttempts(): Record<string, QuizAttempt> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_ATTEMPTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Could not load attempts from localStorage", e);
    return {};
  }
}

export function saveAttempts(attempts: Record<string, QuizAttempt>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch (e) {
    console.error("Could not save attempts to localStorage", e);
  }
}
