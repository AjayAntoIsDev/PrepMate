interface Message {
    role: "system" | "user" | "assistant";
    content: string;
}

interface ChatCompletionOptions {
    model?: string;
    messages: Message[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stop?: string | string[];
    stream?: boolean;
    n?: number;
    logit_bias?: Record<string, number>;
    user_id?: string;
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
    private baseUrl: string = "https://ai.minoa.cat/v1";

    async sendPrompt(
        options: ChatCompletionOptions
    ): Promise<ChatCompletionResponse> {
        const {
            model = "groq/llama-3.3-70b-versatile",
            messages,
            temperature,
            max_tokens,
            top_p,
            frequency_penalty,
            presence_penalty,
            stop,
            stream = false,
            n,
            logit_bias,
            user_id,
        } = options;

        const requestBody: any = {
            model,
            messages,
            stream,
        };

        if (temperature !== undefined) requestBody.temperature = temperature;
        if (max_tokens !== undefined) requestBody.max_tokens = max_tokens;
        if (top_p !== undefined) requestBody.top_p = top_p;
        if (frequency_penalty !== undefined)
            requestBody.frequency_penalty = frequency_penalty;
        if (presence_penalty !== undefined)
            requestBody.presence_penalty = presence_penalty;
        if (stop !== undefined) requestBody.stop = stop;
        if (n !== undefined) requestBody.n = n;
        if (logit_bias !== undefined) requestBody.logit_bias = logit_bias;
        if (user_id !== undefined) requestBody.user = user_id;

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
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

export const MINOA_MODELS = {
    GPT_4: "copilot-more/gpt-4",
    
    LLAMA_4_MAVERICK: "hackclub/meta-llama/llama-4-maverick-17b-128e-instruct",
    LLAMA_3_3_70B_VERSATILE: "groq/llama-3.3-70b-versatile",
    LLAMA_3_3_70B_SPECDEC: "groq/llama-3.3-70b-specdec",
    LLAMA_3_1_8B_INSTANT: "groq/llama-3.1-8b-instant",
    LLAMA_3_70B_8192: "groq/llama3-70b-8192",
    LLAMA_3_8B_8192: "groq/llama3-8b-8192",
    LLAMA_GUARD_3_8B: "groq/llama-guard-3-8b",
    
    MISTRAL_SMALL_LATEST: "mistral/mistral-small-latest",
    PIXTRAL_12B: "mistral/pixtral-12b-2409",
    OPEN_MISTRAL_NEMO: "mistral/open-mistral-nemo",
    OPEN_CODESTRAL_MAMBA: "mistral/open-codestral-mamba",
    
    ALLAM_2_7B: "groq/allam-2-7b",
    GEMMA2_9B_IT: "groq/gemma2-9b-it",
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
