"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QuizScreen } from '../../../components/QuizScreen';
import { getQuizzes, getAttempts, saveAttempts } from '../../../lib/storage';
import { Quiz, QuizAttempt } from '../../../lib/types';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    const id = params.id as string;
    const quizzes = getQuizzes();
    const found = quizzes.find(q => q.id === id);
    if (found) {
      setQuiz(found);
    } else {
      router.push('/dashboard');
    }
  }, [params.id, router]);

  const handleQuizComplete = (answers: Record<number, string | string[]>, starred: number[]) => {
    if (!quiz) return;

    let score = 0;
    const incorrectIndices: number[] = [];

    quiz.questions.forEach((q, idx) => {
      const userAnswer = answers[idx];
      const correct = q.correctAnswer;

      let isCorrect = false;

      if (Array.isArray(correct)) {
        const userArr = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
        const correctArr = [...correct].sort();
        isCorrect = userArr.length === correctArr.length && 
          userArr.every((val, i) => val.trim().toLowerCase() === correctArr[i].trim().toLowerCase());
      } else {
        const userStr = Array.isArray(userAnswer) ? userAnswer[0] || "" : (userAnswer || "");
        isCorrect = userStr.trim().toLowerCase() === correct.trim().toLowerCase();
      }

      if (isCorrect) {
        score++;
      } else {
        incorrectIndices.push(idx);
      }
    });

    const mergedStarred = Array.from(new Set([...starred, ...incorrectIndices]));
    const attempt: QuizAttempt = { answers, starred: mergedStarred, score };
    
    const attempts = getAttempts();
    const newAttempts = { ...attempts, [quiz.id]: attempt };
    saveAttempts(newAttempts);

    router.push(`/results/${quiz.id}`);
  };

  if (!quiz) return <div className="p-8 text-center text-gray-500">Loading quiz...</div>;

  return <QuizScreen quiz={quiz} onComplete={handleQuizComplete} />;
}
