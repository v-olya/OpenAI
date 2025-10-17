import type { ChatCompletionMessage } from 'openai/resources/chat';
import type { ReactNode } from 'react';

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
    // We intentionally keep the timezone identifier (IANA) and compute localHour on the client.
};

export type NewsPreview = {
    title: string;
    summary: string;
    sources?: { domain?: string; url?: string }[];
    url: string;
    image: string;
    imagePrompt: string;
};

// Error messages moved to `app/utils/error-messages.ts` to keep this file type-only.

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

export type AppendMessage = (
    role: 'user' | 'assistant',
    text: string,
    error?: boolean,
    id?: string
) => string | undefined;

// Component prop interfaces
export interface ChatProps {
    chatType: 'weather' | 'news' | 'basic' | 'coding';
    children?: ReactNode;
    onWeatherUpdate?: OnWeatherUpdate;
    onNewsResults?: OnNewsResults;
    onFinishCoding?: OnFinishCoding;
    /** current previews from parent (optional) so Chat can react when previews are cleared */
    newsPreviews?: NewsPreview[] | null;
}

export interface WeatherWidgetProps {
    weather: WeatherData | null;
}

export type StreamMessage = {
    type: 'content' | 'error';
    content: string;
};

export type SetMessages = (
    updater: (prev: MessageType[]) => MessageType[]
) => void;

export type OnFinishCoding = ((result: unknown) => void) | undefined; // TODO specify type

export type OnNewsResults =
    | ((previews: NewsPreview[] | null) => void)
    | undefined;

export type OnWeatherUpdate =
    | ((update: Partial<WeatherData>) => void)
    | undefined;

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
