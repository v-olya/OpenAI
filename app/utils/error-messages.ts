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

export type ErrorMessagesKeys = keyof typeof ErrorMessages;
