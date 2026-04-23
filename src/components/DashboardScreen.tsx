import React, { useRef, useState } from 'react';
import { Quiz, QuizAttempt } from '../types';
import { FileText, Loader2, CheckCircle, Clock, ArrowLeft, Sparkles, Brain, FileUp } from 'lucide-react';
import { QuizMode } from './LandingScreen';

interface DashboardScreenProps {
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  onUpload: (files: File[], instructions?: string) => void;
  onGenerateFromMaterial: (files: File[], numQuestions: number, difficulty: string, instructions?: string) => void;
  isLoading: boolean;
  onTakeQuiz: (id: string) => void;
  onViewResults: (id: string) => void;
  mode: QuizMode;
  onBack: () => void;
}

export function DashboardScreen({ quizzes, attempts, onUpload, onGenerateFromMaterial, isLoading, onTakeQuiz, onViewResults, mode, onBack }: DashboardScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [instructions, setInstructions] = useState("");
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Generation config (only used in 'generate' mode)
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const addFiles = (newFiles: File[]) => {
    setStagedFiles(prev => [...prev, ...newFiles]);
    
    // Generate previews for images
    newFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        // Placeholder for PDFs or non-images
        setPreviews(prev => [...prev, "PDF_PLACEHOLDER"]);
      }
    });
  };

  const removeFile = (index: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          files.push(new File([blob], `pasted_image_${Date.now()}_${i}.png`, { type: blob.type }));
        }
      }
    }

    if (files.length > 0) {
      addFiles(files);
    }
  };

  const handleGenerate = () => {
    if (stagedFiles.length > 0) {
      if (mode === 'generate') {
        onGenerateFromMaterial(stagedFiles, numQuestions, difficulty, instructions);
      } else {
        onUpload(stagedFiles, instructions);
      }
      setStagedFiles([]);
      setPreviews([]);
      setInstructions("");
    }
  };

  const isGenerate = mode === 'generate';
  const accentColor = isGenerate ? '#E67E22' : '#2980b9';
  const accentColorHover = isGenerate ? '#d35400' : '#2471a3';

  return (
    <div className="flex bg-white min-h-[85vh] font-sans border-t border-[#dee2e6]">
      {/* Sidebar */}
      <div className="w-64 bg-[#f8f9fa] border-r border-[#dee2e6] pt-4 hidden md:flex md:flex-col">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#2980b9] hover:bg-gray-200 transition cursor-pointer mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
        <div className="h-px bg-[#dee2e6] mx-4 mb-2" />
        <ul className="text-sm font-semibold text-[#495057]">
          <li className="px-6 py-3 bg-[#e9ecef] border-l-4 text-[#2c3e50] flex items-center gap-2" style={{ borderColor: accentColor }}>
            {isGenerate ? <Brain className="w-4 h-4" /> : <FileUp className="w-4 h-4" />}
            {isGenerate ? 'AI Generation' : 'Upload Questions'}
          </li>
          <li className="px-6 py-3 hover:bg-gray-200 cursor-pointer text-[#495057]">My Quizzes</li>
          <li className="px-6 py-3 hover:bg-gray-200 cursor-pointer">Progress</li>
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 bg-white" onPaste={handlePaste}>
        
        {/* Mode Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ 
            background: `linear-gradient(135deg, ${accentColor}, ${accentColorHover})` 
          }}>
            {isGenerate ? <Sparkles className="w-5 h-5 text-white" /> : <FileUp className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#2c3e50]">
              {isGenerate ? 'Generate Quiz from Study Material' : 'Upload Questions & Solutions'}
            </h1>
            <p className="text-xs text-gray-500">
              {isGenerate 
                ? 'Upload your notes, textbooks, or slides and configure quiz parameters' 
                : 'Upload a PDF or image containing existing questions with answers'}
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-3 italic">Tip: You can paste images (Ctrl+V) or upload multiple files. They will be staged below.</p>
         
        {/* Staged Files Preview */}
        {stagedFiles.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4 p-3 bg-white border border-dashed border-[#dee2e6] rounded">
             {stagedFiles.map((file, idx) => (
               <div key={idx} className="relative group w-20 h-20 border rounded overflow-hidden bg-gray-50">
                 {previews[idx] === "PDF_PLACEHOLDER" ? (
                   <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-gray-500 font-bold p-1 text-center">
                     <FileText className="w-6 h-6 mb-1 text-red-500" />
                     PDF
                   </div>
                 ) : (
                   <img src={previews[idx]} alt="preview" className="w-full h-full object-cover" />
                 )}
                 <button 
                   onClick={() => removeFile(idx)}
                   className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-[10px] rounded-bl opacity-0 group-hover:opacity-100 transition"
                 >
                   &times;
                 </button>
                 <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] px-1 truncate">
                   {file.name}
                 </div>
               </div>
             ))}
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:border-[#2980b9] hover:text-[#2980b9] transition cursor-pointer"
             >
               <span className="text-xl">+</span>
               <span className="text-[10px]">Add More</span>
             </button>
          </div>
        )}

        {/* Generation Config (only for 'generate' mode) */}
        {isGenerate && stagedFiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-4 bg-gradient-to-r from-orange-50/60 to-amber-50/40 border border-orange-200/60 rounded-lg">
            <div>
              <label className="block text-xs font-semibold text-[#2c3e50] mb-1.5">Number of Questions</label>
              <input 
                type="number" 
                min={1} 
                max={50} 
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                className="w-full text-sm p-2.5 border border-[#dee2e6] rounded bg-white text-[#2c3e50] focus:outline-none focus:border-orange-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2c3e50] mb-1.5">Difficulty Level</label>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full text-sm p-2.5 border border-[#dee2e6] rounded bg-white text-[#2c3e50] focus:outline-none focus:border-orange-400 transition cursor-pointer"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed (All Levels)</option>
              </select>
            </div>
          </div>
        )}

        <textarea
          className="w-full text-sm p-3 mb-4 border border-[#dee2e6] rounded bg-white text-[#2c3e50] placeholder-gray-400 focus:outline-none focus:border-[#2980b9] transition"
          placeholder={isGenerate 
            ? "Additional instructions (Optional) e.g., 'Focus on chapter 3 and include conceptual questions'" 
            : "Additional Prompt Instructions (Optional) e.g., 'Make sure to extract 10 questions only'"}
          rows={2}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />

        <div className="flex items-center gap-4 mb-10">
           <input 
             type="file" 
             multiple 
             accept="application/pdf,image/*"
             className="hidden"
             ref={fileInputRef}
             onChange={handleFileChange}
           />
           {stagedFiles.length === 0 ? (
             <button 
               className={`text-white px-5 py-2 text-sm font-semibold rounded-sm tracking-wide flex items-center gap-2 transition ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
               style={{ backgroundColor: '#2c3e50' }}
               onClick={() => fileInputRef.current?.click()}
               onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a252f')}
               onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
             >
               {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
               {isLoading ? 'Processing...' : isGenerate ? 'Add Study Material' : 'Add Documents/Images'}
             </button>
           ) : (
             <button 
               className={`text-white px-6 py-2 text-sm font-bold rounded-sm tracking-wide flex items-center gap-2 shadow-sm transition ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
               style={{ backgroundColor: accentColor }}
               onClick={handleGenerate}
               onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColorHover)}
               onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
             >
               {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                 isGenerate ? <Sparkles className="w-4 h-4" /> : 
                 <div className="bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs" style={{ color: accentColor }}>!</div>
               }
               {isLoading 
                 ? (isGenerate ? 'Generating Quiz...' : 'Processing...') 
                 : (isGenerate ? `Generate ${numQuestions} Questions` : `Extract Quiz (${stagedFiles.length} files)`)}
             </button>
           )}
           
           {stagedFiles.length > 0 && !isLoading && (
             <button 
               onClick={() => { setStagedFiles([]); setPreviews([]); }}
               className="text-gray-500 hover:text-red-500 text-sm font-medium transition"
             >
               Clear All
             </button>
           )}
        </div>


        {/* Existing Quizzes Table */}
        <h2 className="text-2xl font-light text-[#2c3e50] border-b border-[#dee2e6] pb-2 mb-6">My Quizzes</h2>

        {quizzes.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-300">
             <p className="text-gray-500 text-sm">No quizzes have been created yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-[#dee2e6]">
              <thead>
                <tr className="bg-[#e9ecef] text-[#495057] text-sm uppercase tracking-wide">
                  <th className="p-3 border border-[#dee2e6] font-semibold">S.No.</th>
                  <th className="p-3 border border-[#dee2e6] font-semibold w-5/12">Quiz Name</th>
                  <th className="p-3 border border-[#dee2e6] font-semibold">Date Created</th>
                  <th className="p-3 border border-[#dee2e6] font-semibold text-center">Questions</th>
                  <th className="p-3 border border-[#dee2e6] font-semibold text-center">Status</th>
                  <th className="p-3 border border-[#dee2e6] font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[#2c3e50]">
                {quizzes.map((quiz, index) => {
                  const hasAttempt = !!attempts[quiz.id];
                  const attemptInfo = attempts[quiz.id];

                  return (
                    <tr key={quiz.id} className="hover:bg-gray-50 transition">
                      <td className="p-3 border border-[#dee2e6] text-center">{quizzes.length - index}</td>
                      <td className="p-3 border border-[#dee2e6] font-medium text-[#2980b9]">{quiz.title}</td>
                      <td className="p-3 border border-[#dee2e6]">{quiz.date}</td>
                      <td className="p-3 border border-[#dee2e6] text-center">{quiz.questions.length}</td>
                      <td className="p-3 border border-[#dee2e6] text-center">
                        {hasAttempt ? (
                          <span className="inline-flex items-center gap-1 text-[#27ae60] font-semibold">
                            <CheckCircle className="w-4 h-4" /> Submitted
                            <span className="text-xs ml-1 text-gray-500">
                               ({attemptInfo.score}/{quiz.questions.length})
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#e67e22] font-semibold">
                            <Clock className="w-4 h-4" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3 border border-[#dee2e6] text-center">
                        {hasAttempt ? (
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => onViewResults(quiz.id)}
                              className="text-xs bg-[#f39c12] hover:bg-[#d68910] text-white px-3 py-1.5 rounded-sm font-semibold transition"
                            >
                              Results
                            </button>
                            <button 
                              onClick={() => onTakeQuiz(quiz.id)}
                              className="text-xs bg-[#ecf0f1] hover:bg-[#bdc3c7] text-[#2c3e50] border border-[#bdc3c7] px-3 py-1.5 rounded-sm font-semibold transition"
                            >
                              Retake
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => onTakeQuiz(quiz.id)}
                            className="text-xs bg-[#2980b9] hover:bg-[#2471a3] text-white px-4 py-1.5 rounded-sm font-semibold transition"
                          >
                            Take Quiz
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
