import { ErrorMessages } from '@/utils/error-messages';
import type {
    MessageType,
    AppendMessage,
    StreamMessage,
    SetMessages,
} from '@/utils/types';

const STREAM_ERROR_MESSAGE = 'Stream error';

const updateMessageById = (
    messages: MessageType[],
    messageId: string,
    updates: Partial<MessageType>
): MessageType[] => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) {
        return messages;
    }
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        ...updates,
    };
    return updatedMessages;
};

const appendToMessage = (
    messages: MessageType[],
    messageId: string,
    content: string
): MessageType[] => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);

    if (messageIndex === -1) {
        return messages;
    }
    const updatedMessages = [...messages];
    const currentText = updatedMessages[messageIndex].text || '';
    updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        text: currentText + content,
    };
    return updatedMessages;
};

const updateMessagesFromStream = (
    setMessages: SetMessages,
    streamMessageId: string,
    parsed: StreamMessage
): void => {
    if (parsed?.type === 'content' && typeof parsed.content === 'string') {
        setMessages((prev) =>
            appendToMessage(prev, streamMessageId, parsed.content)
        );
    } else if (parsed?.type === 'error') {
        setMessages((prev) =>
            updateMessageById(prev, streamMessageId, {
                text: parsed.content || STREAM_ERROR_MESSAGE,
                error: true,
            })
        );
    }
};

const processStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    setMessages: SetMessages,
    streamMessageId: string
): Promise<void> => {
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIndex = buffer.indexOf('\n');
            while (newlineIndex !== -1) {
                const line = buffer.slice(0, newlineIndex).trim();
                buffer = buffer.slice(newlineIndex + 1);

                if (line) {
                    try {
                        const parsed = JSON.parse(line) as StreamMessage;
                        updateMessagesFromStream(
                            setMessages,
                            streamMessageId,
                            parsed
                        );
                    } catch (err) {
                        console.error(
                            'Failed to parse stream line:',
                            line,
                            err
                        );
                    }
                }
                newlineIndex = buffer.indexOf('\n');
            }
        }
    } finally {
        reader.releaseLock();
    }
};

const handleStreamingResponse = async (
    response: Response,
    setMessages: SetMessages,
    streamMessageId: string
): Promise<void> => {
    if (!response.body) {
        setMessages((prev) =>
            updateMessageById(prev, streamMessageId, {
                text: ErrorMessages.TRY_AGAIN,
                error: true,
            })
        );
        return;
    }

    try {
        const reader = response.body.getReader();
        await processStream(reader, setMessages, streamMessageId);
    } catch (err) {
        console.error('Streaming error:', err);
        setMessages((prev) =>
            updateMessageById(prev, streamMessageId, {
                text: ErrorMessages.TRY_AGAIN,
                error: true,
            })
        );
    }
};

export const handleBasic = async (
    messagesPayload: any[],
    appendMessage: AppendMessage,
    setMessages: SetMessages,
    makeId: () => string
): Promise<void> => {
    try {
        const response = await fetch('/api/basic-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: messagesPayload }),
        });
        if (!response.ok) {
            let errorMsg = ErrorMessages.TRY_AGAIN;
            try {
                const errorData = await response.json();
                if (errorData?.error) {
                    errorMsg = errorData.error;
                }
            } catch {}
            appendMessage('assistant', errorMsg, true);
            return;
        }
        const streamMessageId = makeId();
        appendMessage('assistant', '', false, streamMessageId);

        await handleStreamingResponse(response, setMessages, streamMessageId);
    } catch (err) {
        console.error('Error in handleBasic:', err);
        appendMessage('assistant', ErrorMessages.TRY_AGAIN, true);
    }
};
