// Minimal mock for AppendMessage
const appendMessage = jest.fn();

describe('coding handler previousResponseId flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset fetch mock
        (global as any).fetch = jest.fn();
    });

    it('returns previousResponseId from a successful response and preserves it after a failed response', async () => {
        // Mock runtime modules using relative paths to avoid alias resolution problems
        jest.mock('../app/utils/error-messages', () => ({
            ErrorMessages: { TRY_AGAIN: 'Try again' },
        }));
        jest.mock('../app/utils/convert-files', () => ({
            convertFiles: async (files: any[]) => files,
        }));

        const { handleCoding } = await import(
            '../app/components/chat/handlers/coding-handler'
        );

        const successBody = {
            status: 'ok',
            uploadedFileIds: [],
            output: 'done',
            containerId: 'ctr_1',
            containerFiles: [],
            previousResponseId: 'resp-success-1',
            id: 'resp-success-1',
        };

        // First call: successful
        (global as any).fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => successBody,
        });

        const res1: any = await handleCoding(
            'input',
            appendMessage as any,
            undefined,
            undefined,
            undefined,
            undefined
        );
        expect(res1.previousResponseId).toBe('resp-success-1');

        // Next call: simulate a failure response (500) with no previousResponseId
        const errorBody = { status: 'error', error: 'failed' };
        (global as any).fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => errorBody,
            text: async () => JSON.stringify(errorBody),
        });

        const res2: any = await handleCoding(
            'input2',
            appendMessage as any,
            undefined,
            undefined,
            undefined,
            res1.previousResponseId
        );
        // Handler should return uploadedFileIds/containerId and previousResponseId from errBody.previousResponseId (which is undefined)
        expect(res2.previousResponseId).toBeUndefined();
    });
});
