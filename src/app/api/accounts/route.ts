import { NextResponse } from 'next/server';

// Set runtime to nodejs
export const runtime = 'nodejs';

interface UnipileAccount {
  type: string;
  id: string;
  name: string;
  sources: { status: string }[];
}

interface UnipileResponse {
  object: string;
  items: UnipileAccount[];
}

export async function GET() {
  try {
    const apiKey = process.env.UNIPILE_API_KEY;
    const dsn = process.env.UNIPILE_DSN;

    if (!apiKey || !dsn) {
      console.error('Missing environment variables:', {
        hasApiKey: !!apiKey,
        hasDsn: !!dsn
      });
      return NextResponse.json(
        { error: 'API key or DSN not configured' },
        { status: 500 }
      );
    }

    console.log('Making request to Unipile API:', {
      url: `${dsn}/api/v1/accounts`,
      hasApiKey: !!apiKey
    });

    const response = await fetch(`${dsn}/api/v1/accounts`, {
      headers: {
        'X-API-KEY': apiKey,
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Unipile API error:', {
        status: response.status,
        statusText: response.status,
        error: errorText
      });
      throw new Error(`Failed to fetch accounts from Unipile: ${response.status} ${errorText}`);
    }

    const data: UnipileResponse = await response.json();
    
    // Filter for LinkedIn accounts only and transform the data
    const linkedinAccounts = data.items
      .filter(account => account.type.toLowerCase() === 'linkedin')
      .map((account) => ({
        provider: 'linkedin',
        id: account.id,
        name: account.name.toLowerCase(),
        accountId: `LinkedIn : ${account.name}`,
        // If any source has status "OK", consider it connected
        status: account.sources.some(source => source.status === "OK") ? "connected" : "disconnected"
      }));

    return NextResponse.json(linkedinAccounts);
  } catch (error) {
    console.error('Error fetching accounts:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
} 