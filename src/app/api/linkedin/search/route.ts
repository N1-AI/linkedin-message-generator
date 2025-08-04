import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const accountId = searchParams.get('account_id');

    if (!query) {
      return NextResponse.json({ items: [] });
    }

    const apiKey = process.env.UNIPILE_API_KEY;
    const dsn = process.env.UNIPILE_DSN;

    if (!apiKey || !dsn) {
      return NextResponse.json(
        { error: 'API key or DSN not configured' },
        { status: 500 }
      );
    }

    let linkedInAccountId: string;

    if (accountId) {
      // Use the provided account ID
      linkedInAccountId = accountId;
    } else {
      // Fallback: get the first LinkedIn account ID (for backward compatibility)
      const accountsResponse = await fetch(`${dsn}/api/v1/accounts`, {
        headers: {
          'X-API-KEY': apiKey,
          'accept': 'application/json',
        },
      });

      if (!accountsResponse.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const accountsData = await accountsResponse.json();
      const linkedInAccount = accountsData.items.find((account: any) => account.type === 'LINKEDIN');

      if (!linkedInAccount) {
        throw new Error('No LinkedIn account found');
      }
      
      linkedInAccountId = linkedInAccount.id;
    }

    // Now perform the search with the account ID
    const response = await fetch(
      `${dsn}/api/v1/linkedin/search?account_id=${linkedInAccountId}`,
      {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          api: "classic",
          category: "people",
          network_distance: [1, 2, 3],
          keywords: query
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search LinkedIn contacts');
    }

    const data = await response.json();
    console.log('LinkedIn API raw items:', JSON.stringify(data.items, null, 2));
    // Map degree to string (1st, 2nd, 3rd+)
    const items = (data.items || []).map((item: any) => ({
      ...item,
      degree:
        item.network_distance === 'DISTANCE_1' ? '1st' :
        item.network_distance === 'DISTANCE_2' ? '2nd' :
        (item.network_distance === 'DISTANCE_3' || item.network_distance === 'DISTANCE_3_PLUS') ? '3rd+' :
        '',
    }));
    return NextResponse.json({ ...data, items });
  } catch (error) {
    console.error('Error searching LinkedIn contacts:', error);
    return NextResponse.json(
      { error: 'Failed to search LinkedIn contacts' },
      { status: 500 }
    );
  }
} 