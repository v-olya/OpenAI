export const dispatchNewChat = (p: {
    text: string;
    code?: string;
    file?: string;
}) => {
    window.dispatchEvent(new CustomEvent('openai:newChat', { detail: p }));
};
