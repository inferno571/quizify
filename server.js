import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies up to 50MB (for base64 file uploads)
app.use(express.json({ limit: '50mb' }));

// Serve static files from the Vite build output
app.use(express.static(path.join(__dirname, 'dist')));

// ─── API Routes ────────────────────────────────────────────────

// POST /api/extract-quiz — Extract questions from uploaded document files
app.post('/api/extract-quiz', async (req, res) => {
  try {
    const { files, instructions } = req.body;
    // files: Array<{ data: string (base64), mimeType: string }>

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const { GoogleGenAI, Type } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const fileParts = files.map(f => ({
      inlineData: { data: f.data, mimeType: f.mimeType }
    }));

    const promptText = `Extract the complete quiz from these document(s). If multiple documents are provided, merge all their multiple-choice questions into a single comprehensive quiz. Parse all multiple choice questions, options, the designated correct answer(s), and the provided explanation.

IMPORTANT RULES:
1. For the \`correctAnswer\` field: if the question has ONLY ONE correct answer, provide it as a single STRING with the full text of the correct option exactly as it appears in the \`options\` array.
2. If the question has MULTIPLE correct answers (MSQ / Multiple Select Question), provide \`correctAnswer\` as an ARRAY OF STRINGS, each being the full text of a correct option exactly as it appears in the \`options\` array.
3. Do NOT use option letters (e.g. A, B, C, D) — always use the full option text.
4. If the source material indicates "MSQ" or "multiple answers" or "select all that apply" or has multiple correct options marked, use an array for correctAnswer.${instructions ? `\n\nADDITIONAL USER INSTRUCTIONS:\n${instructions}` : ""}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [...fileParts, { text: promptText }]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A suitable title for the quiz document(s)." },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: {
                    description: "The correct answer(s). A single string for single-answer MCQs, or an array of strings for MSQs (multiple correct answers).",
                    anyOf: [
                      { type: Type.STRING },
                      { type: Type.ARRAY, items: { type: Type.STRING } }
                    ]
                  },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["title", "questions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    if (!parsed.questions || parsed.questions.length === 0) {
      return res.status(422).json({ error: 'No questions could be extracted from the document(s).' });
    }

    res.json(parsed);
  } catch (err) {
    console.error('Extract quiz error:', err);
    res.status(500).json({ error: 'Failed to extract quiz. ' + (err.message || '') });
  }
});

// POST /api/generate-quiz — Generate quiz from study material
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { files, numQuestions, difficulty, instructions } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const { GoogleGenAI, Type } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const fileParts = files.map(f => ({
      inlineData: { data: f.data, mimeType: f.mimeType }
    }));

    const difficultyDesc = {
      easy: 'Easy — basic recall and comprehension questions',
      medium: 'Medium — application and understanding questions',
      hard: 'Hard — analysis, critical thinking, and tricky edge-case questions',
      mixed: 'Mixed — a balanced combination of easy, medium, and hard questions'
    }[difficulty] || 'Medium';

    const promptText = `You are an expert quiz creator. Analyze the provided study material and generate exactly ${numQuestions || 10} multiple-choice questions based on the content.

DIFFICULTY LEVEL: ${difficultyDesc}

RULES:
1. Create original, thoughtful questions that test understanding of the material — not just surface-level recall.
2. Each question must have exactly 4 options (A through D style, but use the full text).
3. For the \`correctAnswer\` field: provide the full text of the correct option exactly as it appears in the \`options\` array. If a question has multiple correct answers, provide an array of the correct option texts.
4. Provide a clear, educational explanation for each answer.
5. Questions should cover different topics from across the study material.
6. Make distractors (wrong options) plausible but clearly incorrect upon careful analysis.
7. Generate a descriptive title for the quiz based on the study material's subject.${instructions ? `\n\nADDITIONAL USER INSTRUCTIONS:\n${instructions}` : ""}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [...fileParts, { text: promptText }]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A descriptive title for the quiz based on the study material." },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: {
                    description: "The correct answer(s). A single string for single-answer MCQs, or an array of strings for MSQs.",
                    anyOf: [
                      { type: Type.STRING },
                      { type: Type.ARRAY, items: { type: Type.STRING } }
                    ]
                  },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["title", "questions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    if (!parsed.questions || parsed.questions.length === 0) {
      return res.status(422).json({ error: 'No questions could be generated from the study material.' });
    }

    res.json(parsed);
  } catch (err) {
    console.error('Generate quiz error:', err);
    res.status(500).json({ error: 'Failed to generate quiz. ' + (err.message || '') });
  }
});

// ─── SPA Fallback ──────────────────────────────────────────────
// All other routes serve index.html (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Quizify server running on port ${PORT}`);
});
