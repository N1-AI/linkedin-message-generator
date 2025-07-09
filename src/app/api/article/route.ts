import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const dateRestrict = searchParams.get('dateRestrict');

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    // Add site-specific search terms for articles
    const sites = [
      'site:substack.com',
      'site:medium.com',
      'site:dev.to',
      'site:hashnode.com',
      'site:hackernoon.com',
      'site:producthunt.com/posts',
      'site:indie.hackers.com'
    ];

    const siteQuery = `(${sites.join(' OR ')}) ${query}`;

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(siteQuery)}${dateRestrict ? `&dateRestrict=${dateRestrict}` : ''}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Google Custom Search API');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in article search API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 