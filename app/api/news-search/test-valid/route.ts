import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    const previews = [
        {
            title: 'Major cultural festival announced in Torino',
            summary:
                'A major cultural festival with international performers was announced today in Torino. Organizers expect thousands of visitors over the coming weeks. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            sources: [
                {
                    domain: 'news.example.org',
                    url: 'https://news.example.org/torino-festival',
                },
                {
                    domain: 'localnews.it',
                    url: 'https://localnews.it/torino-festival',
                },
                {
                    domain: 'another-source.net',
                    url: 'https://another-source.net/torino-festival',
                },
            ],
            url: 'https://news.example.org/torino-festival',
            image: '/preview.jpg',
            verified: true,
        },
        {
            title: 'New transit line to improve commuting in Torino',
            summary:
                'City officials approved a new light-rail line to improve commuting times across Torino. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            sources: [
                {
                    domain: 'blog.example.com',
                    url: 'https://blog.example.com/torino-transit',
                },
                {
                    domain: 'another-source.net',
                    url: 'https://another-source.net/torino-transit',
                },
                {
                    domain: 'news.example.org',
                    url: 'https://news.example.org/torino-transit',
                },
            ],
            url: 'https://blog.example.com/torino-transit',
            image: '/preview.jpg',
            verified: true,
        },
    ];

    return NextResponse.json({ previews });
}
