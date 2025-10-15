import { ErrorMessages, WeatherData } from '@/types';

type AppendMessage = (
    role: 'user' | 'assistant',
    text: string,
    error?: boolean,
    id?: string
) => string | undefined;

type OnWeatherUpdate = ((update: Partial<WeatherData>) => void) | undefined;

export const handleWeather = async (
    text: string,
    appendMessage: AppendMessage,
    onWeatherUpdate: OnWeatherUpdate
) => {
    const response = await fetch(`/api/weather?q=${encodeURIComponent(text)}`);
    if (!response.ok) {
        let errorMsg: string = ErrorMessages.TRY_AGAIN;
        try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
                errorMsg = errorData.error;
            }
        } catch {}
        appendMessage('assistant', errorMsg, true);
        return;
    }
    const data = await response.json();
    if (data.error) {
        appendMessage('assistant', data.error, true);
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
