import { NextResponse } from 'next/server';

function getLastMonthISOString() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString();
}

async function fetchWithLogging(url: string, options: RequestInit, description: string) {
  console.log(`[${description}] Fetching URL:`, url);
  console.log(`[${description}] Request headers:`, options.headers);
  try {
    const response = await fetch(url, options);
    const responseText = await response.text();
    console.log(`[${description}] Response status:`, response.status);
    console.log(`[${description}] Response headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`[${description}] Response body:`, responseText);
    return { 
      ok: response.ok, 
      status: response.status, 
      data: responseText ? JSON.parse(responseText) : null 
    };
  } catch (error) {
    console.error(`[${description}] Error:`, error);
    return { ok: false, status: 500, data: null };
  }
}

async function fetchPostDetails(dsn: string, postId: string, accountId: string, headers: HeadersInit) {
  const postRes = await fetchWithLogging(
    `${dsn}/api/v1/posts/${postId}?account_id=${accountId}`,
    { headers },
    `Post Details ${postId}`
  );
  return postRes.ok ? postRes.data : null;
}

async function fetchMessages(dsn: string, userId: string, accountId: string, headers: HeadersInit) {
  // First get the list of chats
  const chatsRes = await fetchWithLogging(
    `${dsn}/api/v1/chat_attendees/${userId}/chats?account_id=${accountId}`,
    { headers },
    'Chats'
  );

  if (!chatsRes.ok || !chatsRes.data.items) {
    return { messages: [], chatId: null };
  }

  // For each chat, fetch the messages
  const messages = [];
  const firstChat = chatsRes.data.items[0]; // Store first chat for chatId
  
  for (const chat of chatsRes.data.items) {
    const messagesRes = await fetchWithLogging(
      `${dsn}/api/v1/chats/${chat.id}/messages?account_id=${accountId}&limit=50`,
      { headers },
      `Messages for chat ${chat.id}`
    );

    if (messagesRes.ok && messagesRes.data.items) {
      messages.push(...messagesRes.data.items.map((msg: any) => ({
        sender_id: msg.sender_id,
        is_sender: msg.is_sender === 1,
        text: msg.text,
        timestamp: msg.timestamp,
        chat_id: chat.id
      })));
    }
  }

  const sortedMessages = messages.sort((a: any, b: any) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    messages: sortedMessages,
    chatId: firstChat?.id || null
  };
}

export async function POST(request: Request) {
  try {
    console.log('Starting enrich-profile request');
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const apiKey = process.env.UNIPILE_API_KEY;
    const dsn = process.env.UNIPILE_DSN;
    if (!apiKey || !dsn) {
      return NextResponse.json({ error: 'API key or DSN not configured' }, { status: 500 });
    }

    const headers = {
      'X-API-KEY': apiKey,
      'accept': 'application/json',
    };

    // Step 1: Get LinkedIn accountId
    const accountsRes = await fetchWithLogging(
      `${dsn}/api/v1/accounts`,
      { headers },
      'Accounts'
    );
    if (!accountsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: accountsRes.status });
    }
    const linkedinAccount = (accountsRes.data.items || []).find((a: any) => a.type && a.type.toLowerCase() === 'linkedin');
    if (!linkedinAccount) {
      return NextResponse.json({ error: 'No LinkedIn account found' }, { status: 404 });
    }
    const accountId = linkedinAccount.id;
    console.log('Found LinkedIn account ID:', accountId);

    // Step 2: Retrieve the profile
    const profileRes = await fetchWithLogging(
      `${dsn}/api/v1/users/${userId}?account_id=${accountId}`,
      { headers },
      'Profile'
    );
    if (!profileRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: profileRes.status });
    }
    const profile = profileRes.data;

    // Get full name from first_name and last_name if available
    const fullName = profile.first_name && profile.last_name 
      ? `${profile.first_name} ${profile.last_name}`
      : profile.name || '';

    // Step 3: Get last 10 posts, reactions, and comments
    const [postsRes, reactionsRes, commentsRes] = await Promise.all([
      fetchWithLogging(
        `${dsn}/api/v1/users/${userId}/posts?account_id=${accountId}&limit=10`,
        { headers },
        'Posts'
      ),
      fetchWithLogging(
        `${dsn}/api/v1/users/${userId}/reactions?account_id=${accountId}&limit=10`,
        { headers },
        'Reactions'
      ),
      fetchWithLogging(
        `${dsn}/api/v1/users/${userId}/comments?account_id=${accountId}&limit=10`,
        { headers },
        'Comments'
      )
    ]);

    // Process posts
    const posts = (postsRes.ok ? postsRes.data.items : []) || [];
    const simplifiedPosts = posts.map((post: any) => ({
      text: post.text,
      reaction_count: post.reaction_counter,
      comment_count: post.comment_counter,
      date: post.date,
      share_url: post.share_url
    }));

    // Process reactions and fetch their posts
    const reactions = [];
    const reactionItems = (reactionsRes.ok ? reactionsRes.data.items : []) || [];
    for (const reaction of reactionItems) {
      const post = await fetchPostDetails(dsn, reaction.post_id, accountId, headers);
      if (post) {
        reactions.push({
          type: reaction.value,
          date: reaction.date,
          post_text: post.text,
          share_url: post.share_url,
          reaction_count: post.reaction_counter,
          comment_count: post.comment_counter
        });
      }
    }

    // Process comments and fetch their posts
    const comments = [];
    const commentItems = (commentsRes.ok ? commentsRes.data.items : []) || [];
    for (const comment of commentItems) {
      const post = await fetchPostDetails(dsn, comment.post_id, accountId, headers);
      if (post) {
        comments.push({
          text: comment.text,
          date: comment.date,
          reaction_count: comment.reaction_counter,
          post_text: post.text,
          share_url: post.share_url,
          post_reaction_count: post.reaction_counter,
          post_comment_count: post.comment_counter
        });
      }
    }

    // Step 4: Fetch messages and get chatId
    const { messages, chatId } = await fetchMessages(dsn, userId, accountId, headers);

    // Prepare the simplified profile info
    const profileInfo = {
      id: userId,
      name: fullName,
      headline: profile.headline || profile.occupation || '',  // Use occupation as fallback
      profile_picture_url: profile.profile_picture_url || profile.picture_url || '',  // Use picture_url as fallback
      degree: profile.network_distance === 'DISTANCE_1' ? '1st' :
              profile.network_distance === 'DISTANCE_2' ? '2nd' :
              (profile.network_distance === 'DISTANCE_3' || profile.network_distance === 'DISTANCE_3_PLUS') ? '3rd+' :
              profile.network_distance === 'FIRST_DEGREE' ? '1st' :  // Handle the new format
              profile.network_distance === 'SECOND_DEGREE' ? '2nd' :
              profile.network_distance === 'THIRD_DEGREE' ? '3rd+' :
              '',
      chatId // Add chatId to the profile info
    };

    return NextResponse.json({
      profile: profileInfo,
      activity: {
        posts: simplifiedPosts,
        reactions,
        comments
      },
      messages
    });
  } catch (error) {
    console.error('Error in enrich-profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 