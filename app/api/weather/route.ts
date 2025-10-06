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

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getWeather } from '@/app/utils/weather';

// Weather function for OpenAI function calling
async function get_weather({ location }: { location: string }) {
    const weather = await getWeather(location);
    // Add localtime (for demo, UTC)
    return {
        ...weather,
        localtime: new Date().toLocaleString('en-US', { timeZone: 'UTC' }),
    };
}

// Tool definition for OpenAI Assistant
export const weatherTool = {
    name: 'get_weather',
    description: 'Get the current weather and local time for a city',
    parameters: {
        type: 'object',
        properties: {
            location: {
                type: 'string',
                description: 'The city and country, e.g. London, UK',
            },
        },
        required: ['location'],
    },
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    if (typeof query !== 'string' || query.trim().length === 0) {
        return NextResponse.json(
            { error: 'Query parameter "q" must be a non-empty string.' },
            { status: 400 }
        );
    }

    // Debug: Log entry into API route
    console.log('Weather API route called with query:', query);
    const openai = new OpenAI();
    try {
        console.log('Calling OpenAI responses.create...');
        const response = await openai.responses.create({
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
                            error: 'Failed to parse function arguments or fetch weather.',
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
                error: 'Sorry, I could not understand your request.',
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
                    error: 'Weather assistant error',
                    details: (error as { response: { data: unknown } }).response
                        .data,
                },
                { status: 500 }
            );
        }
        return NextResponse.json(
            { error: 'Weather assistant error', details: String(error) },
            { status: 500 }
        );
    }
}
