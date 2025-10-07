import type { ChatCompletionMessage } from 'openai/resources/chat';
import React from 'react';

export type Message = {
    role: 'user' | 'assistant' | 'system' | 'function';
    content: string | null;
    name?: string;
    function_call?: {
        name: string;
        arguments: string;
    };
};

export function isValidMessage(
    message: Message
): message is ChatCompletionMessage {
    return true;
}

export type WeatherData = {
    location?: string;
    temperature?: number;
    windspeed?: number;
    weathercode?: number;
    error?: string;
    conditions?: string;
    unit?: string;
    timezone_offset?: number;
};

export type NewsPreview = {
    title: string;
    summary: string;
    sources?: { domain?: string; url?: string }[];
    url: string;
    image: string;
};

export const ErrorMessages = {
    LOCATION_NOT_FOUND:
        "Sorry, I couldn't find that city. Please check the spelling or try another location.",
    WEATHER_API_ERROR:
        'Unable to retrieve weather data. Please try again later.',
    NO_WEATHER_DATA: 'No weather data available for this location.',
    GENERAL_API_ERROR:
        'Something went wrong while getting the weather. Please try again in a moment.',

    INVALID_QUERY: 'Query parameter must be a non-empty string.',
    FUNCTION_PARSE_ERROR:
        'Failed to parse function arguments or fetch weather.',
    MODEL_TEXT_OUTPUT: 'Model returned text output instead of function call.',
    UNRECOGNIZED_REQUEST: 'Sorry, I could not understand your request.',
} as const;

export type ApiErrorResponse = {
    error: string;
    details?: string;
};

// Component prop interfaces
export interface ChatProps {
    onWeatherUpdate?: (data: WeatherData) => void;
    chatType?: 'weather' | 'news';
    placeholder?: string;
    onNewsResults?: (previews: NewsPreview[]) => void;
    children?: React.ReactNode;
    /** deprecated: use controlBarLeft/controlBarRight to place controls outside the chat container */
    controlBar?: React.ReactNode;
    /** optional left-side controls rendered outside the chat container */
    controlBarLeft?: React.ReactNode;
    /** optional right-side controls rendered outside the chat container */
    controlBarRight?: React.ReactNode;
}

export interface WeatherWidgetProps {
    weather: WeatherData | null;
}

export interface MessageType {
    role: 'user' | 'assistant';
    text: string;
    error?: boolean;
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
