import { getResponseError } from '@/utils/get-response-error';
import { ErrorMessages } from '@/utils/error-messages';
import type { WeatherData, AppendMessage } from '@/utils/types';

type OnWeatherUpdate = ((update: Partial<WeatherData>) => void) | undefined;

export const handleWeather = async (
    text: string,
    appendMessage: AppendMessage,
    onWeatherUpdate: OnWeatherUpdate
) => {
    const response = await fetch(`/api/weather?q=${encodeURIComponent(text)}`);
    if (!response.ok) {
        appendMessage('assistant', await getResponseError(response), true);
        return;
    }
    const data = await response.json();
    if (!data.location) {
        appendMessage('assistant', ErrorMessages.LOCATION_NOT_FOUND, true);
        return;
    }
    // Show resolvedName if the detected location didn't include a region
    const detectedRegion = data.location?.includes(',');
    const resolvedSuffix =
        data.resolvedName && !detectedRegion
            ? ` (Resolved to ${data.resolvedName})`
            : '';
    appendMessage(
        'assistant',
        `Weather data received and displayed in the widget.${resolvedSuffix}`
    );
    if (onWeatherUpdate) {
        // compute numeric hour for the target timezone so we can render night icons
        let localHour: number | undefined = undefined;
        if (data.timezone) {
            try {
                const hourStr = new Date().toLocaleString('en-US', {
                    hour: '2-digit',
                    hour12: false,
                    timeZone: data.timezone,
                });
                const parsed = parseInt(hourStr, 10);
                if (!Number.isNaN(parsed)) localHour = parsed;
            } catch {}
        }
        onWeatherUpdate({
            location: data.location,
            resolvedName: data.resolvedName,
            temperature: data.temperature,
            windspeed: data.windspeed,
            weathercode: data.weathercode,
            error: data.error,
            conditions: '',
            unit: 'C',
            timezone: data.timezone,
            localHour,
        });
    }
};
