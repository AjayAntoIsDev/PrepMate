import { sendPrompt, DEEPINFRA_MODELS } from "./sendPrompt";
import { createCacheManager, CACHE_CONFIGS } from "../cache/cache";
import {storage} from "../storage/storage";

interface GenerateNotesParams {
    subject: string;
    topic: string;
    exam: string;
}

interface GenerateNotesResponse {
    success: boolean;
    notes?: string;
    error?: string;
    fromCache?: boolean;
}

const cacheManager = createCacheManager(storage);

const SYSTEM_PROMPT = `You are a note-generation assistant designed to help students prepare for competitive exams like JEE and NEET.

I will give you:
- Subject
- Topic
- Exam

You will generate detailed and high-quality study notes in **Markdown format** (no LaTeX or math markup). Follow this exact structure and style guide:

---

## Overview
Start with a short introduction that explains what the topic is, why it's important for the given exam, and how it connects to real-world concepts or other topics.

---

## Essentials
This section comes early and should include **memorization-focused content** that the student needs quick access to:
- Key formulas (written as plaintext like \`F = ma\`)
- Definitions
- Classifications
- Units and dimensions
- Constants
- Short facts, tips, and identities

Use bullet points and keep it scannable but thorough.

---

## Theory & Concepts
Break down the main ideas of the topic in depth:
- Use headings for subtopics (e.g., Newton's Laws, Types of Forces)
- Explain key concepts clearly, with simple and direct language
- Include examples and analogies where helpful

---

## Problem Types
List common types of problems asked in this topic:
- Conceptual questions
- Numerical derivations
- Multi-step problems
- Graph-based questions (describe verbally if needed)

Include brief tips on how to solve each type.

---

## Common Mistakes & Misconceptions
Mention frequent errors students make and how to avoid them.

---

## Tips & Tricks
Provide any quick shortcuts, memory aids, or exam-specific strategies.

---

## Practice Questions
Write 2–4 short practice-style questions relevant to the topic (no answers needed).

---

Formatting rules:
- Use **Markdown only**
- Do **not** use LaTeX (use plain \`F = ma\`, \`P = W/t\` instead)
- Be clear, precise, and helpful
- Target content for serious exam prep (not oversimplified)
- No need for the heading \`# [Topic] - [Subject] Study Notes for [Exam]\` at the start`;


export async function generateNotes({
    subject,
    topic,
    exam
}: GenerateNotesParams): Promise<GenerateNotesResponse> {
    try {
        const cacheKey = `${exam}_${subject}_${topic}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        
        const cachedNotes = cacheManager.get('ai_notes', cacheKey, CACHE_CONFIGS.AI_GENERATED_CONTENT);
        if (cachedNotes) {
            return {
                success: true,
                notes: cachedNotes,
                fromCache: true
            };
        }
        
        const userPrompt = `Now generate the notes for:

Subject: ${subject}
Topic: ${topic}
Exam: ${exam}`;

        const response = await sendPrompt({
            model: DEEPINFRA_MODELS.DEEPSEEK_V3,
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT
                },
                {
                    role: "user", 
                    content: userPrompt
                }
            ],
            temperature: 0.7,
            max_tokens: 6000,
        });

        const aiResponse = response.choices[0]?.message?.content;
        if (!aiResponse) {
            throw new Error("No response from AI");
        }

        const notes = aiResponse.trim();

        cacheManager.set(
            'ai_notes',
            cacheKey,
            notes,
            CACHE_CONFIGS.AI_GENERATED_CONTENT,
            {
                subject,
                topic,
                exam,
                generatedAt: Date.now(),
                version: "1.0"
            }
        );

        return {
            success: true,
            notes,
            fromCache: false
        };

    } catch (error) {
        console.error('Error generating notes:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export function hasNotesInCache(subject: string, topic: string, exam: string): boolean {
    const cacheKey = `${exam}_${subject}_${topic}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return cacheManager.has('ai_notes', cacheKey);
}

export {
    type GenerateNotesParams,
    type GenerateNotesResponse
};
