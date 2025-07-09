interface MessageStyle {
  description: string;
  examples: string[];
  guidelines: string[];
}

export const lengthStyles: Record<number, MessageStyle> = {
  1: {
    description: "Ultra-brief, single thought messages",
    examples: [
      "Hows Singapore treating you? Just got back from there myself!",
      "That Redis solution working out better now? Saved us last week 😅",
    ],
    guidelines: [
      "Keep it under 2 sentences",
      "Focus on one specific point",
      "Be direct but friendly",
      "Quick personal connection if possible",
      "Brief anecdote if relevant",
    ]
  },
  2: {
    description: "Brief but complete messages",
    examples: [
      "Been experimenting with that caching approach myself. Really smoothed out our API performance after we hit similar limits!",
      "Singapore's tech scene is wild right now! Just met some founders there doing similar stuff - the startup energy is incredible.",
    ],
    guidelines: [
      "2-3 sentences maximum",
      "Include a brief context",
      "One main point with a quick follow-up",
      "Share a relevant mini-experience",
      "Make it personal but concise",
    ]
  },
  3: {
    description: "Balanced, conversational messages",
    examples: [
      "Your Redis implementation got me thinking about our own caching issues. We actually tried something similar last sprint but added rate limiting at the application layer. Made a huge difference in stability - wish we'd done it months ago!",
      "Caught up with some folks from the Singapore tech scene at a conference last week. They're tackling the exact same scaling challenges. Funny how similar the problems are across different markets - we had the same headaches when expanding into SEA.",
    ],
    guidelines: [
      "3-4 sentences",
      "Balance context and substance",
      "Include personal experience",
      "Share a relevant story or insight",
      "Natural conversation flow",
    ]
  },
  4: {
    description: "Detailed, comprehensive messages",
    examples: [
      "Been deep-diving into distributed caching lately after we hit some nasty scaling issues. Your approach with Redis really resonated with what we discovered. We ended up implementing a similar solution but added Kafka for event streaming - reminded me of my old team's architecture at Google. Would love to compare notes on how you handled the consistency issues.",
      "The way you're navigating Singapore's tech ecosystem is fascinating. Reminds me of my time scaling teams in emerging markets - especially the year I spent building out our APAC hub. The talent pool dynamics you mentioned parallel what we saw in other hubs. Had a good laugh with my old team about the time we tried to solve everything with microservices. How are you finding the local engineering culture?",
    ],
    guidelines: [
      "4-5 sentences",
      "Rich context and detail",
      "Share relevant experiences",
      "Include a meaningful anecdote",
      "Connect through shared experiences",
      "Open-ended but focused discussion",
    ]
  }
};

export const formalityStyles: Record<number, MessageStyle> = {
  1: {
    description: "Super casual, friend-to-friend",
    examples: [
      "Yo! That cache thing you did = genius 🙌 Totally saved me when our API went crazy last night 😅",
      "Singapore life looks amazing! Miss the food yet? I'm still dreaming about that laksa from my last visit 🤤",
    ],
    guidelines: [
      "Use emojis naturally",
      "Informal abbreviations ok",
      "Text-style language",
      "Very conversational",
      "Share fun personal stories",
      "Keep it light and relatable",
    ]
  },
  2: {
    description: "Casual but professional",
    examples: [
      "That caching solution you implemented looks solid! Been trying something similar after our API started throwing fits. Game changer!",
      "How's the Singapore tech scene treating you? Just wrapped up a project with a team there - such a different vibe from what we have here.",
    ],
    guidelines: [
      "Friendly and approachable",
      "Light professional context",
      "Some informal language ok",
      "Share relevant experiences",
      "Keep anecdotes work-focused",
      "Personal but not too casual",
    ]
  },
  3: {
    description: "Professional with warmth",
    examples: [
      "Your insights on API caching strategies were quite helpful. We implemented something similar in our latest project, and the performance improvements have been remarkable. It reminded me of a similar challenge we solved at my previous company.",
      "Your perspective on Singapore's technological landscape is interesting. Having recently collaborated with several teams in the region, I've observed similar patterns in the innovation ecosystem. How are you finding the development culture there?",
    ],
    guidelines: [
      "Proper grammar and punctuation",
      "Professional terminology",
      "Warm but businesslike",
      "Industry-appropriate language",
      "Share professional experiences",
      "Keep anecdotes relevant and polished",
    ]
  },
  4: {
    description: "Formal business",
    examples: [
      "I appreciated your technical analysis regarding API optimization strategies. Having led similar initiatives at enterprise scale, your implementation of Redis for distributed caching presents some compelling advantages. Our team observed comparable benefits when deploying this architecture at our APAC data centers.",
      "Your observations about Singapore's technological infrastructure and market dynamics align with recent industry analyses. Based on my experience leading regional expansion initiatives, I'd be interested in your assessment of the enterprise adoption patterns you're encountering.",
    ],
    guidelines: [
      "Formal business language",
      "Full professional terminology",
      "Structured sentences",
      "Industry-specific references",
      "Share relevant professional context",
      "Frame experiences formally",
      "Maintain professional distance",
    ]
  }
}; 