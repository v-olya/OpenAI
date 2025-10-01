import type { ChatCompletionMessage } from 'openai/resources/chat';

// Define our simplified message type
export type Message = {
    role: 'user' | 'assistant' | 'system' | 'function';
    content: string | null;
    name?: string;
    function_call?: {
        name: string;
        arguments: string;
    };
};

// Type guard to ensure message is compatible with OpenAI's API
export function isValidMessage(
    message: Message
): message is ChatCompletionMessage {
    return true;
}

export const weatherFunction = {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    parameters: {
        type: 'object',
        properties: {
            location: {
                type: 'string',
                description: 'The city and state, e.g. London, UK',
            },
        },
        required: ['location'],
    },
} as const;
