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

    // Remove protocol and port from DSN if present
    const dsnBase = dsn.replace(/^https?:\/\//, '').split(':')[0];
    
    // Create FormData
    const formData = new FormData();
    formData.append('text', text);

    // Send message using the Unipile API
    const response = await fetch(
      `https://${dsnBase}:14756/api/v1/chats/${chatId}/messages`,
      {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'accept': 'application/json',
          // Don't set Content-Type header, let the browser set it with the boundary
        },
        body: formData
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