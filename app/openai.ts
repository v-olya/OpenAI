import OpenAI from 'openai';
import type { ChatCompletionCreateParams } from 'openai/resources/chat';

export const openai = new OpenAI();

export type Message = ChatCompletionCreateParams['messages'][number];

export type ChatResponse = {
    role: 'assistant';
    content: string;
};

export type StreamResponse =
    | { type: 'content'; content: string }
    | { type: 'function_call'; function: { name: string; arguments: string } };

const weatherFunction = {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    parameters: {
        type: 'object',
        properties: {
            location: {
                type: 'string',
                description: 'The city and state, e.g. San Francisco, CA',
            },
        },
        required: ['location'],
    },
} as const;

export async function* createChatCompletion(
    messages: Message[],
    enableFunctions = false
): AsyncGenerator<StreamResponse> {
    const response = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages,
        stream: true,
        ...(enableFunctions && {
            functions: [weatherFunction],
            function_call: 'auto',
        }),
    });

    let functionCall: { name: string; arguments: string } | null = null;

    try {
        for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta;

            if (delta?.function_call) {
                if (!functionCall) {
                    functionCall = { name: '', arguments: '' };
                }
                if (delta.function_call.name) {
                    functionCall.name += delta.function_call.name;
                }
                if (delta.function_call.arguments) {
                    functionCall.arguments += delta.function_call.arguments;
                }
            } else if (delta?.content) {
                yield { type: 'content', content: delta.content };
            }
        }

        if (functionCall) {
            yield { type: 'function_call', function: functionCall };
        }
    } catch (error) {
        console.error('Error in chat completion stream:', error);
        throw error;
    }
}
