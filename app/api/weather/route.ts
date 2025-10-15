import { NextResponse } from 'next/server';
import { getWeather } from '@/utils/weather';
import { ErrorMessages } from '@/types';
import { client } from '@/init-client';

async function get_weather({ location }: { location: string }) {
    const weather = await getWeather(location);

    let localtime = new Date().toLocaleString('en-US', { timeZone: 'UTC' });

    if (weather.timezone) {
        try {
            localtime = new Date().toLocaleString('en-US', {
                timeZone: weather.timezone,
            });
        } catch {
            console.warn(
                'Invalid timezone:',
                weather.timezone,
                'falling back to UTC'
            );
        }
    }

    return {
        ...weather,
        localtime,
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    if (typeof query !== 'string' || query.trim().length === 0) {
        return NextResponse.json(
            { error: ErrorMessages.INVALID_QUERY },
            { status: 400 }
        );
    }

    try {
        console.log('Calling OpenAI responses.create...');
        const response = await client.responses.create({
            model: 'gpt-4.1',
            input: [
                {
                    role: 'system',
                    content:
                        'You are a weather assistant. Detect the city from the user query and call the get_weather function. Respond only with a strict JSON object: { "location": string, "temperature": number, "windspeed": number, "weathercode": number, "localtime": string, "error": string | null }.',
                },
                {
                    role: 'user',
                    content: query,
                },
            ],
            tools: [
                {
                    type: 'function',
                    name: 'get_weather',
                    description:
                        'Get the current weather and local time for a city',
                    parameters: {
                        type: 'object',
                        properties: {
                            location: {
                                type: 'string',
                                description:
                                    'The city and country, e.g. London, UK',
                            },
                        },
                        required: ['location'],
                        additionalProperties: false,
                    },
                    strict: true,
                },
            ],
            tool_choice: 'auto',
        });
        console.log('OpenAI response:', response);
        // Check if function was called using type guards
        if (Array.isArray(response.output) && response.output.length > 0) {
            const firstOutput = response.output[0];
            if (isFunctionCallOutput(firstOutput)) {
                try {
                    const args = JSON.parse(firstOutput.arguments);
                    const weather = await get_weather(args);
                    return NextResponse.json(weather);
                } catch (err) {
                    return NextResponse.json(
                        {
                            error: ErrorMessages.FUNCTION_PARSE_ERROR,
                            details: String(err),
                        },
                        { status: 500 }
                    );
                }
            }
            if (isTextOutput(firstOutput)) {
                // If model returns text, wrap it in a JSON object for strictness
                return NextResponse.json(
                    {
                        error: 'Model returned text output instead of function call.',
                        details: firstOutput.text,
                    },
                    { status: 500 }
                );
            }
        }
        return NextResponse.json(
            {
                error: ErrorMessages.UNRECOGNIZED_REQUEST,
                details: 'Please ask about a specific city.',
            },
            { status: 500 }
        );
    } catch (error: unknown) {
        console.error('Weather API error:', error);
        if (
            typeof error === 'object' &&
            error !== null &&
            'response' in error &&
            typeof (error as { response?: unknown }).response === 'object' &&
            (error as { response?: { data?: unknown } }).response &&
            'data' in (error as { response: { data?: unknown } }).response
        ) {
            return NextResponse.json(
                {
                    error: ErrorMessages.WEATHER_API_ERROR,
                    details: (error as { response: { data: unknown } }).response
                        .data,
                },
                { status: 500 }
            );
        }
        return NextResponse.json(
            { error: ErrorMessages.WEATHER_API_ERROR, details: String(error) },
            { status: 500 }
        );
    }
}

// Type guards for OpenAI Responses API output items
function isFunctionCallOutput(
    item: unknown
): item is { type: string; name: string; arguments: string } {
    return (
        typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        (item as { type: string }).type === 'function_call' &&
        'name' in item &&
        (item as { name: string }).name === 'get_weather' &&
        'arguments' in item &&
        typeof (item as { arguments: unknown }).arguments === 'string'
    );
}
function isTextOutput(item: unknown): item is { text: string } {
    return (
        typeof item === 'object' &&
        item !== null &&
        'text' in item &&
        typeof (item as { text: unknown }).text === 'string'
    );
}
