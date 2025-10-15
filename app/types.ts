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
    /** display name resolved from geocoder (Nominatim) */
    resolvedName?: string;
    temperature?: number;
    windspeed?: number;
    weathercode?: number;
    error?: string;
    conditions?: string;
    unit?: string;
    /** timezone identifier returned from weather API, e.g. "Europe/London" */
    timezone?: string;
    /** numeric hour (0-23) at the location - used for night detection */
    localHour?: number;
    // Note: we intentionally keep the timezone identifier (IANA) and compute
    // localHour on the client. We don't return server-side localtime or
    // timezone offsets to avoid ambiguity.
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
    INVALID_QUERY: 'Query parameter must be a non-empty string.',
    FUNCTION_PARSE_ERROR:
        'Failed to parse function arguments or fetch weather.',
    UNRECOGNIZED_REQUEST: 'Sorry, I could not understand your request.',
    UNEXPECTED_RESPONSE: 'Unexpected response from server.',
    TRY_AGAIN: 'An error occurred. Please try again.',
} as const;

export type ApiErrorResponse = {
    error: string;
    details?: string;
};

export interface MessageType {
    role: 'user' | 'assistant';
    text: string;
    error?: boolean;
    /** optional stable id to track and update messages */
    id?: string;
}

// Component prop interfaces
export interface ChatProps {
    chatType: 'weather' | 'news' | 'basic';
    placeholder?: string;
    children?: React.ReactNode;
    onWeatherUpdate?: (data: WeatherData) => void;
    onNewsResults?: (previews: NewsPreview[] | null) => void;
    /** current previews from parent (optional) so Chat can react when previews are cleared */
    newsPreviews?: NewsPreview[] | null;
}

export interface WeatherWidgetProps {
    weather: WeatherData | null;
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
