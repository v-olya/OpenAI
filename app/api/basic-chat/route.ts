import { client } from '@/utils/init-client';

import type { ChatCompletionCreateParams } from 'openai/resources/chat';
type Message = ChatCompletionCreateParams['messages'][number];

export type StreamResponse = { type: 'content'; content: string };

async function* createChatCompletion(
    messages: Message[]
): AsyncGenerator<StreamResponse> {
    const response = await client.chat.completions.create({
        model: 'gpt-4.1',
        messages,
        stream: true,
    });

    try {
        for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta;

            if (delta?.content) {
                yield { type: 'content', content: delta.content };
            }
        }
    } catch (error) {
        console.error('Error in chat completion stream:', error);
    }
}

export const runtime = 'nodejs';

export async function POST(request: Request) {
    const { messages } = (await request.json()) as {
        messages: Message[];
    };

    const stream = createChatCompletion(messages);

    return new Response(
        new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of stream) {
                        if (chunk.type === 'content') {
                            controller.enqueue(
                                encoder.encode(
                                    JSON.stringify({
                                        type: 'content',
                                        content: chunk.content,
                                    }) + '\n'
                                )
                            );
                        }
                    }
                } catch (error) {
                    console.error('Chat API error:', error);
                    controller.enqueue(
                        encoder.encode(
                            JSON.stringify({
                                type: 'error',
                                content:
                                    'Sorry, I could not process your request due to a technical issue.',
                            }) + '\n'
                        )
                    );
                }
                controller.close();
            },
        })
    );
}
