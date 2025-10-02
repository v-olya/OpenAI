import { createChatCompletion, Message } from '@/app/openai';
import { getWeather } from '@/app/utils/weather';

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
                            const { name, arguments: args } = chunk.function;
                            if (name === 'get_weather') {
                                const params = JSON.parse(args);
                                const weatherData = await getWeather(
                                    params.location
                                );
                                // No logs
                                // Normalize weather data for frontend compatibility
                                const weatherDataOut = {
                                    location: weatherData.location ?? '',
                                    temperature: weatherData.temperature ?? 0,
                                    unit: weatherData.unit ?? 'C',
                                    weathercode:
                                        weatherData.weathercode ?? undefined,
                                    windspeed:
                                        weatherData.windspeed ?? undefined,
                                    error: weatherData.error ?? undefined,
                                };
                                controller.enqueue(
                                    encoder.encode(
                                        JSON.stringify({
                                            type: 'weather_data',
                                            data: weatherDataOut,
                                        }) + '\n'
                                    )
                                );
                                if (weatherData.error) {
                                    controller.enqueue(
                                        encoder.encode(
                                            JSON.stringify({
                                                type: 'error',
                                                content: `Error: ${weatherData.error}`,
                                            }) + '\n'
                                        )
                                    );
                                    return;
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
                } catch (err) {
                    controller.enqueue(
                        encoder.encode(
                            JSON.stringify({
                                type: 'error',
                                content: 'An error occurred in the backend.',
                            }) + '\n'
                        )
                    );
                }
                controller.close();
            },
        })
    );
}
