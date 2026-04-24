"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardScreen } from '../../../components/DashboardScreen';
import { extractQuizFromFiles, generateQuizFromMaterial } from '../../../lib/api';
import { getQuizzes, saveQuizzes, getAttempts, saveAttempts } from '../../../lib/storage';
import { Quiz, QuizAttempt } from '../../../lib/types';
import { QuizMode } from '../../../components/LandingScreen';

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode') as QuizMode;
  const mode = modeParam === 'generate' || modeParam === 'upload' ? modeParam : 'upload';

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Record<string, QuizAttempt>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuizzes(getQuizzes());
    setAttempts(getAttempts());
  }, []);

  const updateQuizzes = (newQuizzes: Quiz[]) => {
    setQuizzes(newQuizzes);
    saveQuizzes(newQuizzes);
  };

  const handleUpload = async (files: File[], instructions?: string) => {
    setIsUploading(true);
    setError(null);
    try {
      const extractedContent = await extractQuizFromFiles(files, instructions);
      const newQuiz: Quiz = {
        id: Date.now().toString(),
        title: files.length > 1 ? `Combined Assignment (${files.length} parts)` : (extractedContent.title || files[0].name.replace(/\.[^/.]+$/, "")),
        date: new Date().toLocaleDateString('en-GB'),
        questions: extractedContent.questions
      };
      updateQuizzes([newQuiz, ...quizzes]);
    } catch (err: any) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to parse the documents. Please make sure they are valid PDFs containing questions.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateFromMaterial = async (files: File[], numQuestions: number, difficulty: string, instructions?: string) => {
    setIsUploading(true);
    setError(null);
    try {
      const generatedContent = await generateQuizFromMaterial(files, numQuestions, difficulty, instructions);
      const newQuiz: Quiz = {
        id: Date.now().toString(),
        title: generatedContent.title || `Generated Quiz (${numQuestions} Qs)`,
        date: new Date().toLocaleDateString('en-GB'),
        questions: generatedContent.questions
      };
      updateQuizzes([newQuiz, ...quizzes]);
    } catch (err: any) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate quiz from the study material. Please try again or upload different content.");
    } finally {
      setIsUploading(false);
    }
  };

  const startQuiz = (id: string) => {
    router.push(`/quiz/${id}`);
  };

  const viewResults = (id: string) => {
    router.push(`/results/${id}`);
  };

  const backToLanding = () => {
    router.push('/');
  };

  return (
    <>
      {error && (
        <div className="m-6 p-4 bg-[#fdf2e9] border border-[#e67e22] text-[#d35400] text-sm font-semibold rounded shadow-sm flex justify-between items-center">
          {error}
          <button onClick={() => setError(null)} className="text-xl">&times;</button>
        </div>
      )}
      <DashboardScreen 
        quizzes={quizzes} 
        attempts={attempts} 
        isLoading={isUploading} 
        onUpload={handleUpload} 
        onGenerateFromMaterial={handleGenerateFromMaterial}
        onTakeQuiz={startQuiz}
        onViewResults={viewResults}
        mode={mode}
        onBack={backToLanding}
      />
    </>
  );
}
