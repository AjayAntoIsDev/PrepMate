import { sendPrompt, CEREBRAS_MODELS } from "./sendPrompt";
import { createCacheManager, CACHE_CONFIGS } from "../cache/cache";
import { storage } from "../storage/storage";

interface GenerateQuizParams {
    subject: string;
    topic: string;
    exam: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    questionCount?: number;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    yap: string;
}

export interface Quiz {
    questions: QuizQuestion[];
    totalQuestions: number;
    estimatedTime: number;
}

interface GenerateQuizResponse {
    success: boolean;
    quiz?: Quiz;
    error?: string;
    fromCache?: boolean;
}

const cacheManager = createCacheManager(storage);

const SYSTEM_PROMPT = `You are a quiz generation assistant designed to create high-quality multiple-choice questions for competitive exams like JEE and NEET.

I will provide you with:
- Subject
- Topic  
- Exam type
- Difficulty level
- Number of questions

You must generate a quiz in **valid JSON format** following this exact structure:

{
  "questions": [
    {
      "question": "Question text here",
      "options": [
        "Option A text",
        "Option B text", 
        "Option C text",
        "Option D text"
      ],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why this answer is correct and why others are wrong"
    }
  ]
}

**Guidelines for question generation:**

1. **Question Quality:**
   - Questions should be exam-relevant and test understanding, not just memorization
   - Use clear, unambiguous language
   - Avoid trick questions unless they test important conceptual understanding
   - Include numerical problems, conceptual questions, and application-based problems

2. **Difficulty Levels:**
   - **Easy**: Direct application of formulas, basic definitions, simple calculations
   - **Medium**: Multi-step problems, moderate application of concepts, some analysis required
   - **Hard**: Complex multi-concept problems, advanced applications, requires deep understanding

3. **Options:**
   - All options should be plausible and realistic
   - Avoid obvious wrong answers unless testing basic knowledge
   - Use common misconceptions as distractors
   - Ensure only one option is clearly correct

4. **Explanations:**
   - Explain why the correct answer is right
   - Briefly explain why key distractors are wrong
   - Include relevant formulas or concepts
   - Keep explanations educational and helpful

5. **Format Requirements:**
   - Return ONLY valid JSON, no markdown code blocks, no additional text
   - Do not wrap the response in code blocks or any other formatting
   - Use proper JSON escaping for special characters
   - Mathematical expressions should use plain text (e.g., "F = ma", "x^2 + 3x - 4")
   - Every question must have a complete explanation

6. **Exam-Specific Focus:**
   - **JEE**: Emphasize problem-solving, application, and numerical analysis
   - **NEET**: Focus on conceptual understanding, factual knowledge, and biological processes

Generate questions that would realistically appear in the specified exam and help students practice effectively.`;

export async function generateQuiz({
    subject,
    topic,
    exam,
    difficulty = 'medium',
    questionCount = 5
}: GenerateQuizParams): Promise<GenerateQuizResponse> {
    try {
        const cacheKey = `${exam}_${subject}_${topic}_${difficulty}_${questionCount}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        
        const cachedQuiz = cacheManager.get('ai_quizzes', cacheKey, CACHE_CONFIGS.AI_GENERATED_CONTENT);
        if (cachedQuiz) {
            console.log(`📋 Using cached quiz: ${subject} - ${topic}`);
            return {
                success: true,
                quiz: cachedQuiz,
                fromCache: true
            };
        }

        const userPrompt = `Generate a quiz with the following specifications:

Subject: ${subject}
Topic: ${topic}
Exam: ${exam}
Difficulty: ${difficulty}
Number of Questions: ${questionCount}

Return the quiz in the exact JSON format specified in the system prompt.`;

        console.log(`Generating new quiz: ${subject} - ${topic} (${difficulty})`);

        const response = await sendPrompt({
            model: CEREBRAS_MODELS.LLAMA_3_1_8B,
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT,
                },
                {
                    role: "user",
                    content: userPrompt,
                },
            ],
            temperature: 0.8,
            max_completion_tokens: 4000,
        });

        const aiResponse = response.choices[0]?.message?.content;
        if (!aiResponse) {
            throw new Error("No response from AI");
        }

        let parsedQuiz;
        try {
            let cleanResponse = aiResponse.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            parsedQuiz = JSON.parse(cleanResponse);
        } catch (parseError) {
            console.error("Failed to parse AI response as JSON:", aiResponse);
            throw new Error("AI returned invalid JSON format");
        }

        if (!parsedQuiz.questions || !Array.isArray(parsedQuiz.questions)) {
            throw new Error("Invalid quiz format: missing questions array");
        }

        const quiz: Quiz = {
            questions: parsedQuiz.questions.map((q: any) => ({
                question: q.question,
                options: q.options || [],
                correctAnswer: q.correctAnswer || 0,
                yap: q.explanation || "No explanation provided"
            })),
            totalQuestions: parsedQuiz.questions.length,
            estimatedTime: Math.ceil(parsedQuiz.questions.length * 1.5) 
        };

        for (let i = 0; i < quiz.questions.length; i++) {
            const question = quiz.questions[i];
            if (!question.question || !question.options || question.options.length !== 4) {
                throw new Error(`Invalid question format at index ${i}`);
            }
            if (question.correctAnswer < 0 || question.correctAnswer > 3) {
                throw new Error(`Invalid correct answer index for question at index ${i}`);
            }
        }

        cacheManager.set(
            'ai_quizzes',
            cacheKey,
            quiz,
            CACHE_CONFIGS.AI_GENERATED_CONTENT
        );

        console.log(`Generated quiz: ${quiz.questions.length} questions for ${subject} - ${topic}`);

        return {
            success: true,
            quiz,
            fromCache: false
        };

    } catch (error) {
        console.error('Error generating quiz:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export {
    type GenerateQuizParams,
    type GenerateQuizResponse
};



