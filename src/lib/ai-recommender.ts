import { EnrichedData } from "@/types/linkedin";

interface MessageSettings {
  professional: number;  // 1-4 scale
  length: number;       // 1-3 scale
  purposes: string[];   // Selected purposes
  language: 'ENG' | 'ITA';  // Selected language
}

interface RecommenderInput {
  profileData: EnrichedData;
  settings: MessageSettings;
}

interface PersonSummary {
  interests: string[];
  communities: string[];
  viewpoints: string[];
  currentNeeds: string[];
}

interface ArticleRecommendation {
  title: string;
  url: string;
  summary: string;
  message: string;
}

interface PodcastRecommendation {
  title: string;
  url: string;
  summary: string;
  message: string;
}

export interface GeneralMessage {
  text: string;
  context: string;
}

interface RecommendationOutput {
  personSummary: PersonSummary;
  articleRecommendation: ArticleRecommendation;
  podcastRecommendation: PodcastRecommendation;
  generalMessages: GeneralMessage[];
}

function getFirstName(fullName: string | undefined): string {
  if (!fullName) return 'there';
  return fullName.split(' ')[0];
}

async function callAIApi(profileData: EnrichedData, prompt: string, format: 'json' | 'text' = 'text'): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, format })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    if (format === 'json') {
      return JSON.stringify(data.result);
    }

    return data.result;
  } catch (error) {
    console.error('Error calling AI API:', error);
    throw error;
  }
}

async function generateAIAnalysis(profileData: EnrichedData): Promise<PersonSummary> {
  try {
    const prompt = `Analyze this LinkedIn user's activity and generate insights about their interests, communities, viewpoints, and current needs. Focus on recent patterns and explicit interests.

Profile Info:
${JSON.stringify(profileData.profile, null, 2)}

Recent Posts:
${JSON.stringify(profileData.activity.posts.slice(0, 5), null, 2)}

Recent Comments:
${JSON.stringify(profileData.activity.comments.slice(0, 5), null, 2)}

Recent Reactions:
${JSON.stringify(profileData.activity.reactions.slice(0, 5), null, 2)}

Format the response as a JSON object with these arrays:
{
  "interests": [],
  "communities": [],
  "viewpoints": [],
  "currentNeeds": []
}`;

    const content = await callAIApi(profileData, prompt, 'json');
    if (!content) {
      throw new Error('No content in AI response');
    }

    const response = JSON.parse(content);
    return response as PersonSummary;
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    return {
      interests: [],
      communities: [],
      viewpoints: [],
      currentNeeds: []
    };
  }
}

async function generateMessageSequence(profileData: EnrichedData, prompt: string, messageCount: number = 1): Promise<string[]> {
  try {
    const firstName = getFirstName(profileData.profile.name);
    const enhancedPrompt = `Generate ${messageCount} natural, conversational messages as part of a sequence. Use their first name "${firstName}" naturally and casually in the conversation, but don't overuse it. The messages should flow naturally as if sent over time (minutes or hours apart).

Original context: ${prompt}

Format the response as a JSON array of strings, where each string is a complete message.
Make sure the messages build on each other naturally and maintain context.
Keep the tone casual and friendly - write as if messaging a colleague you know well.`;

    console.log('Message Sequence Prompt:', enhancedPrompt);
    const content = await callAIApi(profileData, enhancedPrompt, 'json');
    console.log('Message Sequence Response:', content);

    if (!content) {
      throw new Error('No content in AI response');
    }

    const messages = JSON.parse(content);
    return Array.isArray(messages) ? messages : [messages];
  } catch (error) {
    console.error('Error generating message sequence:', error);
    return [];
  }
}

async function searchRecentArticles(profileData: EnrichedData, interests: string[], settings: MessageSettings): Promise<ArticleRecommendation> {
  const sites = [
    'site:substack.com',
    'site:medium.com',
    'site:dev.to',
    'site:hashnode.com',
    'site:hackernoon.com',
    'site:producthunt.com/posts',
    'site:indie.hackers.com'
  ];
  
  const searchQuery = `(${sites.join(' OR ')}) (${interests.join(' OR ')}) after:${new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`;
  console.log('Article Search Query:', searchQuery);
  
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&dateRestrict=m6`);
    const data = await response.json();
    console.log('Article Search Results:', data);
    
    if (data.items && data.items.length > 0) {
      const article = data.items[0];
      const firstName = getFirstName(profileData.profile.name);
      const formality = settings.professional >= 3 ? 'professional' : 'casual';
      
      const messagePrompt = `Write a ${formality} message to ${firstName} sharing an interesting article.

Article Title: ${article.title}
Article Summary: ${article.snippet}

Key guidelines:
${formality === 'professional' ? `
- Maintain a polite, professional tone
- Use proper grammar and punctuation
- Avoid colloquialisms and slang
- Reference specific business value or professional insights
- Keep the tone warm but businesslike` : `
- Write like you're texting a friend
- Keep it super casual and natural
- Use conversational language
- Add personal anecdotes or experiences
- Keep it friendly and relatable`}
- Include {url} as the article link
- Reference something specific from the article
- Keep it focused and concise

Example tone (but write your own):
${formality === 'professional' ? 
  `"I came across an insightful analysis of [specific aspect] that aligns with our previous discussion about [topic]. The perspective on [specific point] in {url} offers some valuable considerations."` :
  `"Just read about [specific aspect] - totally changed how I think about [topic]! The part about [specific point] in {url} really got me thinking."`}`;

      const messages = await generateMessageSequence(profileData, messagePrompt, 1);
      const message = messages[0];

      // Ensure the message contains the {url} placeholder
      if (!message.includes('{url}')) {
        const modifiedMessage = `${message}\n\n{url}`;
        return {
          title: article.title,
          url: article.link,
          summary: article.snippet,
          message: modifiedMessage
        };
      }

      return {
        title: article.title,
        url: article.link,
        summary: article.snippet,
        message
      };
    }
  } catch (error) {
    console.error('Error searching for articles:', error);
  }
  
  const firstName = getFirstName(profileData.profile.name);
  const formality = settings.professional >= 3 ? 'professional' : 'casual';
  return {
    title: "Default Article",
    url: "https://example.com",
    summary: "Article about technology trends",
    message: formality === 'professional' ? 
      `I thought you might find this analysis of emerging technology trends relevant to your work. The insights on AI workflows in {url} are particularly noteworthy.` :
      `Been reading about emerging tech - some really cool stuff about AI workflows! Check it out: {url}`
  };
}

async function searchPodcasts(profileData: EnrichedData, interests: string[], settings: MessageSettings): Promise<PodcastRecommendation> {
  const sites = [
    'site:podcasts.apple.com',
    'site:spotify.com/episode',
    'site:open.spotify.com/episode',
    'site:anchor.fm',
    'site:listennotes.com'
  ];
  
  const searchQuery = `(${sites.join(' OR ')}) (${interests.join(' OR ')}) after:${new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`;
  console.log('Podcast Search Query:', searchQuery);
  
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&dateRestrict=m6`);
    const data = await response.json();
    console.log('Podcast Search Results:', data);
    
    if (data.items && data.items.length > 0) {
      const podcast = data.items[0];
      const firstName = getFirstName(profileData.profile.name);
      
      const messagePrompt = `Write a message to ${firstName} recommending a podcast episode.

Episode Title: ${podcast.title}
Episode Summary: ${podcast.snippet}

Key guidelines:
- Write in the same style as the article recommendation
- Use {url} as a placeholder for the episode link
- Reference something specific from the episode
- Keep it focused and concise
- Don't directly reference their profile/posts
- Make the connection feel natural and organic

Example:
"This discussion about [specific topic] reminded me of some challenges we've been tackling. The insights about [specific point] in {url} really resonated. Curious to hear your thoughts on their approach."`;

      const messages = await generateMessageSequence(profileData, messagePrompt, 1);
      const message = messages[0];

      // Ensure the message contains the {url} placeholder
      if (!message.includes('{url}')) {
        const modifiedMessage = `${message}\n\n{url}`;
        return {
          title: podcast.title,
          url: podcast.link,
          summary: podcast.snippet,
          message: modifiedMessage
        };
      }

      return {
        title: podcast.title,
        url: podcast.link,
        summary: podcast.snippet,
        message
      };
    }
  } catch (error) {
    console.error('Error searching for podcasts:', error);
  }
  
  return {
    title: "Default Podcast",
    url: "https://example.com/podcast",
    summary: "Podcast about industry insights",
    message: `Found this great discussion about emerging tech trends. The part about AI implementation strategies is particularly relevant. {url}`
  };
}

async function generateGeneralMessages(profileData: EnrichedData, personSummary: PersonSummary, messageSettings: MessageSettings): Promise<GeneralMessage[]> {
  try {
    const messageCount = 6; // Always generate 6 general messages
    const firstName = getFirstName(profileData.profile.name);
    const formality = messageSettings.professional >= 3 ? 'professional' : 'casual';
    
    const prompt = `Write ${messageCount} ${formality} messages to ${firstName}. Each message should be a separate conversation starter.

Recent Activity:
${JSON.stringify({
  posts: profileData.activity.posts.slice(0, 2),
  comments: profileData.activity.comments.slice(0, 2),
  reactions: profileData.activity.reactions.slice(0, 2)
}, null, 2)}

Their Interests: ${personSummary.interests.join(', ')}

Key guidelines:
${formality === 'professional' ? `
- Maintain a polite, professional tone
- Use proper grammar and punctuation
- Avoid colloquialisms and slang
- Focus on professional insights and business value
- Keep questions focused on professional context
- Reference specific industry trends or developments` : `
- Write like you're texting a friend
- Keep it super casual and natural
- Use conversational language
- Add personal anecdotes or experiences
- Keep questions specific and timely
- Make it friendly and relatable`}
- Reference specific details from their activity
- Each message should be a single, focused thought
- Vary the topics and approaches

Example tones (but write your own):
${formality === 'professional' ? 
  `"Your insights on optimizing API performance were quite interesting. Have you considered implementing a caching layer to address the rate limiting challenges?"` :
  `"That productivity hack you mentioned saved me hours yesterday! Using it for my side project now 😄"`}

Format as JSON array:
[
  {
    "text": "the message text",
    "context": "brief context about why this message is relevant"
  }
]`;

    console.log('General Messages Prompt:', prompt);
    const content = await callAIApi(profileData, prompt, 'json');
    console.log('General Messages Response:', content);

    if (!content) {
      throw new Error('No content in AI response');
    }

    const response = JSON.parse(content);
    return Array.isArray(response) ? response : [response];
  } catch (error) {
    console.error('Error generating messages:', error);
    return [];
  }
}

export async function generateRecommendation(input: RecommenderInput): Promise<RecommendationOutput> {
  const { profileData, settings } = input;
  console.log('Generating recommendations for:', profileData.profile.name);
  console.log('With settings:', settings);
  
  try {
    // First get the person summary
    const personSummary = await generateAIAnalysis(profileData);
    console.log('Person Summary:', personSummary);
    
    // Generate article and podcast recommendations and general messages in parallel
    const [articleRec, podcastRec, generalMessages] = await Promise.all([
      searchRecentArticles(profileData, personSummary.interests, settings),
      searchPodcasts(profileData, personSummary.interests, settings),
      generateGeneralMessages(profileData, personSummary, settings)
    ]);
    
    const result = {
      personSummary,
      articleRecommendation: articleRec,
      podcastRecommendation: podcastRec,
      generalMessages
    };
    
    console.log('Final Recommendations:', result);
    return result;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
} 