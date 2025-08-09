import { CEREBRAS_API_KEY } from './apiKey';

interface Message {
    role: "system" | "user" | "assistant";
    content: string;
}

interface ChatCompletionOptions {
    model?: string;
    messages: Message[];
    temperature?: number;
    max_completion_tokens?: number;
    top_p?: number;
    stop?: string;
    stream?: boolean;
    user?: string;
}

interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

class AIClient {
    private baseUrl: string = "https://api.cerebras.ai/v1";
    private apiKey: string = CEREBRAS_API_KEY;

    async sendPrompt(
        options: ChatCompletionOptions
    ): Promise<ChatCompletionResponse> {
        const {
            model = "llama3.1-8b",
            messages,
            temperature,
            max_completion_tokens,
            top_p,
            stop,
            stream = false,
            user,
        } = options;

        const requestBody: any = {
            model,
            messages,
            stream,
        };

        if (temperature !== undefined) requestBody.temperature = temperature;
        if (max_completion_tokens !== undefined) requestBody.max_completion_tokens = max_completion_tokens;
        if (top_p !== undefined) requestBody.top_p = top_p;
        if (stop !== undefined) requestBody.stop = stop;
        if (user !== undefined) requestBody.user = user;

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
        };

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: "POST",
                headers,
                body: JSON.stringify(requestBody),
            });

            console.log(response)

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `API error: ${response.status} - ${errorText}`
                );
            }

            return await response.json();
        } catch (error) {
            throw new Error(
                `Failed to send prompt: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        }
    }

    async sendMessage(
        content: string,
        model?: string,
        options?: Partial<ChatCompletionOptions>
    ): Promise<string> {
        const response = await this.sendPrompt({
            model,
            messages: [{ role: "user", content }],
            ...options,
        });

        return response.choices[0]?.message?.content ;
    }

    async chat(
        messages: Message[],
        model?: string,
        options?: Partial<ChatCompletionOptions>
    ): Promise<ChatCompletionResponse> {
        return this.sendPrompt({
            model,
            messages,
            ...options,
        });
    }
}

export const CEREBRAS_MODELS = {
    LLAMA_4_SCOUT_17B: "llama-4-scout-17b-16e-instruct",
    LLAMA_3_1_8B: "llama3.1-8b",
    LLAMA_3_3_70B: "llama-3.3-70b",
    LLAMA_4_MAVERICK_17B: "llama-4-maverick-17b-128e-instruct",
    QWEN_3_32B: "qwen-3-32b",
    QWEN_3_235B_A22B_INSTRUCT: "qwen-3-235b-a22b-instruct-2507",
    QWEN_3_235B_A22B_THINKING: "qwen-3-235b-a22b-thinking-2507",
    QWEN_3_CODER_480B: "qwen-3-coder-480b",
    GPT_OSS_120B: "gpt-oss-120b",
    DEEPSEEK_R1_DISTILL_LLAMA_70B: "deepseek-r1-distill-llama-70b",
};

const aiClient = new AIClient();

export const sendPrompt = (options: ChatCompletionOptions) =>
    aiClient.sendPrompt(options);
export const sendMessage = (
    content: string,
    model?: string,
    options?: Partial<ChatCompletionOptions>
) => aiClient.sendMessage(content, model, options);
export const chat = (
    messages: Message[],
    model?: string,
    options?: Partial<ChatCompletionOptions>
) => aiClient.chat(messages, model, options);

export {
    AIClient,
    type Message,
    type ChatCompletionOptions,
    type ChatCompletionResponse,
};
