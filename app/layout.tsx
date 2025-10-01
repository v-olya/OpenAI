import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "OpenAI Chat Completions API Demo",
  description:
    "A demo showcasing the OpenAI Chat Completions API with function calling",
  icons: {
    icon: "/openai.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <img className="logo" src="/openai.svg" alt="OpenAI Logo" />
      </body>
    </html>
  );
}
