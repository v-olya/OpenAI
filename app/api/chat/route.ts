import { createChatCompletion, Message } from '@/app/openai';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    const { messages } = (await request.json()) as {
        messages: Message[];
    };

    // Stream OpenAI responses and handle function calls for weather lookup
    const stream = createChatCompletion(messages, true);

    return new Response(
        new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of stream) {
                        if (chunk.type === 'function_call') {
                            // If function_call, just pass through or handle as needed
                            controller.enqueue(
                                encoder.encode(
                                    JSON.stringify({
                                        type: 'function_call',
                                        function: chunk.function,
                                    }) + '\n'
                                )
                            );
                        } else if (chunk.type === 'content') {
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
                    // Show user-friendly message
                    controller.enqueue(
                        encoder.encode(
                            JSON.stringify({
                                type: 'error',
                                content:
                                    'Sorry, I could not process your request due to a technical issue. Please check your input or try again in a moment.',
                            }) + '\n'
                        )
                    );
                }
                controller.close();
            },
        })
    );
}
