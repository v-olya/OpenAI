import { ErrorMessages } from './error-messages';

export async function getResponseError(res: Response): Promise<string> {
    try {
        const errorData = await res.json();
        return (
            errorData?.details ?? errorData?.error ?? ErrorMessages.TRY_AGAIN
        );
    } catch {
        return ErrorMessages.TRY_AGAIN;
    }
}
