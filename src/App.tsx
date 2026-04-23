import React, { useState, useEffect } from 'react';
import { LandingScreen, QuizMode } from './components/LandingScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { extractQuizFromFiles, generateQuizFromMaterial } from './services/gemini';
import { Quiz, QuizAttempt } from './types';

type AppState = 'LANDING' | 'DASHBOARD' | 'QUIZ' | 'RESULTS';

export default function App() {
  const [appState, setAppState] = useState<AppState>('LANDING');
  const [quizMode, setQuizMode] = useState<QuizMode>('upload');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Record<string, QuizAttempt>>({});
  
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [activeQuizAnswers, setActiveQuizAnswers] = useState<Record<number, string | string[]>>({});
  const [activeQuizStarred, setActiveQuizStarred] = useState<number[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const storedQuizzes = localStorage.getItem('nptel_quizzes');
      if (storedQuizzes) setQuizzes(JSON.parse(storedQuizzes));
      const storedAttempts = localStorage.getItem('nptel_attempts');
      if (storedAttempts) setAttempts(JSON.parse(storedAttempts));
    } catch(e) {
      console.error("Could not load from localStorage", e);
    }
  }, []);

  const saveQuizzes = (newQuizzes: Quiz[]) => {
    setQuizzes(newQuizzes);
    localStorage.setItem('nptel_quizzes', JSON.stringify(newQuizzes));
  };

  const saveAttempts = (newAttempts: Record<string, QuizAttempt>) => {
    setAttempts(newAttempts);
    localStorage.setItem('nptel_attempts', JSON.stringify(newAttempts));
  };

  const handleSelectMode = (mode: QuizMode) => {
    setQuizMode(mode);
    setAppState('DASHBOARD');
  };

  // Upload mode: extract existing questions from files
  const handleUpload = async (files: File[], instructions?: string) => {
    setIsUploading(true);
    setError(null);
    try {
      const extractedContent = await extractQuizFromFiles(files, instructions);
      
      const newQuiz: Quiz = {
        id: Date.now().toString(),
        title: files.length > 1 ? `Combined Assignment (${files.length} parts)` : (extractedContent.title || files[0].name.replace(/\.[^/.]+$/, "")),
        date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY format
        questions: extractedContent.questions
      };

      saveQuizzes([newQuiz, ...quizzes]);
    } catch (err) {
      console.error(err);
      setError("Failed to parse the documents. Please make sure they are valid PDFs containing questions.");
    } finally {
      setIsUploading(false);
    }
  };

  // Generate mode: create quiz questions from study material
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

      saveQuizzes([newQuiz, ...quizzes]);
    } catch (err) {
      console.error(err);
      setError("Failed to generate quiz from the study material. Please try again or upload different content.");
    } finally {
      setIsUploading(false);
    }
  };

  const startQuiz = (id: string) => {
    setActiveQuizId(id);
    setAppState('QUIZ');
  };

  const viewResults = (id: string) => {
    const attempt = attempts[id];
    if (attempt) {
      setActiveQuizId(id);
      setActiveQuizAnswers(attempt.answers);
      setActiveQuizStarred(attempt.starred);
      setAppState('RESULTS');
    }
  };

  const handleQuizComplete = (answers: Record<number, string | string[]>, starred: number[]) => {
    if (!activeQuizId) return;

    const quiz = quizzes.find(q => q.id === activeQuizId);
    if (!quiz) return;

    let score = 0;
    const incorrectIndices: number[] = [];

    quiz.questions.forEach((q, idx) => {
      const userAnswer = answers[idx];
      const correct = q.correctAnswer;

      let isCorrect = false;

      if (Array.isArray(correct)) {
        // MSQ: compare sorted arrays
        const userArr = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
        const correctArr = [...correct].sort();
        isCorrect = userArr.length === correctArr.length && 
          userArr.every((val, i) => val.trim().toLowerCase() === correctArr[i].trim().toLowerCase());
      } else {
        // Single answer MCQ
        const userStr = Array.isArray(userAnswer) ? userAnswer[0] || "" : (userAnswer || "");
        isCorrect = userStr.trim().toLowerCase() === correct.trim().toLowerCase();
      }

      if (isCorrect) {
        score++;
      } else {
        incorrectIndices.push(idx);
      }
    });

    // Merge manually starred + all incorrectly answered into the starred/important list
    const mergedStarred = Array.from(new Set([...starred, ...incorrectIndices]));

    const attempt: QuizAttempt = { answers, starred: mergedStarred, score };
    
    // Save attempt globally
    const newAttempts = { ...attempts, [activeQuizId]: attempt };
    saveAttempts(newAttempts);

    // Enter results view mode
    setActiveQuizAnswers(answers);
    setActiveQuizStarred(mergedStarred);
    setAppState('RESULTS');
  };

  const backToDashboard = () => {
    setAppState('DASHBOARD');
    setActiveQuizId(null);
    setActiveQuizAnswers({});
    setActiveQuizStarred([]);
    setError(null);
  };

  const backToLanding = () => {
    setAppState('LANDING');
    setActiveQuizId(null);
    setActiveQuizAnswers({});
    setActiveQuizStarred([]);
    setError(null);
  };

  const activeQuiz = activeQuizId ? quizzes.find(q => q.id === activeQuizId) : null;

  if (appState === 'QUIZ' && activeQuiz) {
    return <QuizScreen quiz={activeQuiz} onComplete={handleQuizComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-[#2c3e50]">
      {/* Header */}
      <header className="bg-white px-8 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-6 cursor-pointer" onClick={appState === 'LANDING' ? undefined : backToLanding}>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-inner">
               <div className="w-6 h-6 border-4 border-white rounded-full"></div>
            </div>
            <div className="h-10 w-px bg-gray-300 mx-2"></div>
            <div className="leading-tight">
              <div className="font-black text-xl tracking-tight text-[#2c3e50]">QUIZIFY</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 bg-white">
        {error && (
          <div className="m-6 p-4 bg-[#fdf2e9] border border-[#e67e22] text-[#d35400] text-sm font-semibold rounded shadow-sm flex justify-between items-center">
            {error}
            <button onClick={() => setError(null)} className="text-xl">&times;</button>
          </div>
        )}

        {appState === 'LANDING' ? (
          <LandingScreen onSelectMode={handleSelectMode} />
        ) : appState === 'DASHBOARD' ? (
          <DashboardScreen 
            quizzes={quizzes} 
            attempts={attempts} 
            isLoading={isUploading} 
            onUpload={handleUpload} 
            onGenerateFromMaterial={handleGenerateFromMaterial}
            onTakeQuiz={startQuiz}
            onViewResults={viewResults}
            mode={quizMode}
            onBack={backToLanding}
          />
        ) : appState === 'RESULTS' && activeQuiz ? (
          <ResultsScreen 
            quiz={activeQuiz} 
            answers={activeQuizAnswers} 
            starred={activeQuizStarred} 
            onBack={backToDashboard} 
          />
        ) : null}
      </main>
      
      {/* Footer */}
      {(appState === 'LANDING' || appState === 'DASHBOARD' || appState === 'RESULTS') && (
         <footer className="py-6 bg-[#2c3e50] text-[#bdc3c7] text-xs text-center border-t-4 border-[#E67E22]">
           © 2026 Quizify. All rights reserved.
         </footer>
      )}
    </div>
  );
}
