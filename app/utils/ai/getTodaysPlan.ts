import { sendPrompt, DEEPINFRA_MODELS } from "./sendPrompt";
import examConfig from "@/app/config.json";

interface CompletedSubjects {
    [subject: string]: string[];
}

interface TodaysPlan {
    subjects: {
        [subject: string]: string[];
    };
    totalTopics: number;
    reasoning: string;
}

type ExamType = "JEE" | "NEET";

async function getTodaysPlan(
    daysTillExam: number,
    completedStuff: CompletedSubjects,
    examType: ExamType
): Promise<TodaysPlan> {
    if (daysTillExam <= 0) {
        throw new Error("Days till exam must be greater than 0");
    }

    const examData = examConfig[examType];
    const allSubjects = examData.subjects;

    const remainingSubjects: { [subject: string]: string[] } = {};
    Object.keys(allSubjects).forEach((subject) => {
        const completed = completedStuff[subject] || [];
        const remaining = allSubjects[subject].filter(
            (topic) => !completed.includes(topic)
        );
        if (remaining.length > 0) {
            remainingSubjects[subject] = remaining;
        }
    });

    if (Object.keys(remainingSubjects).length === 0) {
        return {
            subjects: {},
            totalTopics: 0,
            reasoning:
                "All subjects completed",
        };
    }

    const totalRemainingTopics = Object.values(remainingSubjects).reduce(
        (sum, topics) => sum + topics.length,
        0
    );

    const prompt = `You are an expert study planner for ${examType} exam preparation. Create an optimal study plan for TODAY.

**Exam Details:**
- Exam: ${examType}
- Days remaining: ${daysTillExam}
- Exam pattern: ${examData.examData.pattern || examData.examData.mode}
- Total remaining topics: ${totalRemainingTopics}

**Remaining Topics by Subject:**
${JSON.stringify(remainingSubjects, null, 2)}

**Planning Guidelines:**
1. Distribute 3-5 topics optimally across subjects for today's 8-hour study session
2. Balance heavy conceptual topics with lighter revision topics
3. Consider ${examType}-specific weightage and difficulty
4. If exam is very close (< 15 days), prioritize high-weightage topics
5. If exam is far (> 60 days), allow comprehensive topic coverage
6. Ensure realistic completion within one day

**Response Format (JSON only):**
{
  "subjects": {
    "SubjectName": ["topic1", "topic2"],
    "AnotherSubject": ["topic3"]
  },
  "totalTopics": 4,
  "reasoning": "Brief explanation of today's study strategy"
}

Return only the JSON object, no additional text.`;
    try {
        const response = await sendPrompt({
            model: DEEPINFRA_MODELS.LLAMA_TURBO,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 800,
        });

        const aiResponse = response.choices[0]?.message?.content;
        if (!aiResponse) {
            throw new Error("No response from AI");
        }

        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Could not parse AI response as JSON");
        }

        const planData = JSON.parse(jsonMatch[0]);

        if (!planData.subjects || typeof planData.reasoning !== "string") {
            throw new Error("Invalid response structure from AI");
        }

        return {
            subjects: planData.subjects,
            totalTopics: planData.totalTopics || 0,
            reasoning: planData.reasoning,
        };
    } catch (error) {
        throw new Error(
            `Failed to generate plan: ${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
}

export {
    getTodaysPlan,
    type CompletedSubjects,
    type TodaysPlan,
    type ExamType,
};