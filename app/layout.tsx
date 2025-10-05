import { Inter } from 'next/font/google';
import './globals.css';
import Image from 'next/image';
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'OpenAI Chat Completions API Demo',
    description:
        'A demo showcasing the OpenAI Chat Completions API with function calling',
    icons: {
        icon: '/openai.svg',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang='en'>
            <body className={inter.className}>
                {children}
                <Image
                    className='logo'
                    width={32}
                    height={32}
                    src='/openai.svg'
                    alt='OpenAI Logo'
                />
            </body>
        </html>
    );
}
