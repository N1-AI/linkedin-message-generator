import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { chatId, text } = await request.json();

    if (!chatId || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.UNIPILE_API_KEY;
    const dsn = process.env.UNIPILE_DSN;

    if (!apiKey || !dsn) {
      return NextResponse.json({ error: 'API key or DSN not configured' }, { status: 500 });
    }

    // Create request body
    const requestBody = {
      text: text
    };

    // Send message using the Unipile API
    const response = await fetch(
      `${dsn}/api/v1/chats/${chatId}/messages`,
      {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from Unipile:', errorText);
      throw new Error(`Failed to send message: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in send-message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
} 