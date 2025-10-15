import { Inter } from 'next/font/google';
import './styles/globals.scss';
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'OpenAI API Consumer',
    description:
        'A demo showcasing the OpenAI API capabilities including agentic tasks, web search, image creation, function calling, etc.',
    icons: {
        icon: '/openai.svg',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang='en'>
            <body className={inter.className}>{children}</body>
        </html>
    );
}
