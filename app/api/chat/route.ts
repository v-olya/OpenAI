import { createChatCompletion, Message } from '@/app/openai';
import { getWeather } from '@/app/utils/weather';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    const { messages } = (await request.json()) as {
        messages: Message[];
    };

    // Always enable functions as we want to support weather queries
    const stream = createChatCompletion(messages, true);

    return new Response(
        new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of stream) {
                        if (chunk.type === 'function_call') {
                            const {
                                function: { name, arguments: args },
                            } = chunk;

                            if (name === 'get_weather') {
                                const params = JSON.parse(args);
                                const weatherData = getWeather(params.location);

                                // Send weather data back as a message
                                controller.enqueue(
                                    encoder.encode(
                                        JSON.stringify({
                                            type: 'weather_data',
                                            data: weatherData,
                                        }) + '\n'
                                    )
                                );

                                // Continue with a new chat completion to handle the weather data
                                const functionMessages = [...messages];
                                functionMessages.push({
                                    role: 'assistant',
                                    content: null,
                                    function_call: {
                                        name: 'get_weather',
                                        arguments: args,
                                    },
                                } as Message);
                                functionMessages.push({
                                    role: 'function',
                                    name: 'get_weather',
                                    content: JSON.stringify(weatherData),
                                } as Message);

                                const functionStream = createChatCompletion(
                                    functionMessages,
                                    true
                                );

                                // Stream the response that includes the weather data
                                for await (const functionChunk of functionStream) {
                                    if (functionChunk.type === 'content') {
                                        controller.enqueue(
                                            encoder.encode(
                                                JSON.stringify({
                                                    type: 'content',
                                                    content:
                                                        functionChunk.content,
                                                }) + '\n'
                                            )
                                        );
                                    }
                                }
                            }
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
                    // Close the stream after all chunks are sent
                    controller.close();
                } catch (err) {
                    console.error('Error in chat stream:', err);
                    controller.error(err);
                }
            },
        })
    );
}
