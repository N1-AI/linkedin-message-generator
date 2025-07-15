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

async function callAIApi(profileData: EnrichedData, prompt: string, format: 'json' | 'text' = 'text', language: 'ENG' | 'ITA' = 'ENG'): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, format, language })
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

async function generateAIAnalysis(profileData: EnrichedData, language: 'ENG' | 'ITA' = 'ENG'): Promise<PersonSummary> {
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

    const content = await callAIApi(profileData, prompt, 'json', language);
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

async function generateMessageSequence(profileData: EnrichedData, prompt: string, messageCount: number = 1, language: 'ENG' | 'ITA' = 'ENG'): Promise<string[]> {
  try {
    const firstName = getFirstName(profileData.profile.name);
    const enhancedPrompt = `Generate ${messageCount} natural, conversational messages as part of a sequence. Use their first name "${firstName}" naturally and casually in the conversation, but don't overuse it. The messages should flow naturally as if sent over time (minutes or hours apart).

Original context: ${prompt}

Format the response as a JSON array of strings, where each string is a complete message.
Make sure the messages build on each other naturally and maintain context.
Keep the tone casual and friendly - write as if messaging a colleague you know well.`;

    console.log('Message Sequence Prompt:', enhancedPrompt);
    const content = await callAIApi(profileData, enhancedPrompt, 'json', language);
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

      const messages = await generateMessageSequence(profileData, messagePrompt, 1, settings.language);
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
      const formality = settings.professional >= 3 ? 'professional' : 'casual';
      
      const messagePrompt = `Write a ${formality} message to ${firstName} sharing an interesting podcast.

Podcast Title: ${podcast.title}
Podcast Summary: ${podcast.snippet}

Key guidelines:
${formality === 'professional' ? `
- Maintain a polite, professional tone
- Use proper grammar and punctuation
- Avoid colloquialisms and slang
- Reference specific professional insights
- Keep the tone warm but businesslike` : `
- Write like you're texting a friend
- Keep it super casual and natural
- Use conversational language
- Add personal anecdotes or experiences
- Keep it friendly and relatable`}
- Include {url} as the podcast link
- Reference something specific from the podcast
- Keep it focused and concise

Example tone (but write your own):
${formality === 'professional' ? 
  `"I discovered a compelling podcast discussing [specific aspect] that offers nuanced insights into [topic]. The discussion at {url} provides a fresh perspective on emerging trends."` :
  `"OMG, just listened to this podcast about [specific aspect] - totally blew my mind! The part about [specific point] at {url} is 🔥"`}`;

      const messages = await generateMessageSequence(profileData, messagePrompt, 1, settings.language);
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
  
  const firstName = getFirstName(profileData.profile.name);
  const formality = settings.professional >= 3 ? 'professional' : 'casual';
  return {
    title: "Default Podcast",
    url: "https://example.com/podcast",
    summary: "Podcast about technology and innovation",
    message: formality === 'professional' ? 
      `I recently came across an insightful podcast discussing emerging technology trends. The analysis of AI and innovation workflows in {url} provides a compelling perspective on current industry developments.` :
      `Found this awesome podcast about tech trends! The AI and innovation stuff at {url} is super interesting.`
  };
}

async function generateGeneralMessages(profileData: EnrichedData, personSummary: PersonSummary, messageSettings: MessageSettings): Promise<GeneralMessage[]> {
  try {
    const firstName = getFirstName(profileData.profile.name);
    const prompt = `Generate 2-3 general, conversational messages that feel natural and contextual based on the user's profile and interests.

User Profile Summary:
${JSON.stringify(personSummary, null, 2)}

Key Guidelines:
- Use the first name "${firstName}" naturally
- Reference their interests and professional context subtly
- Keep messages varied and engaging
- Avoid direct references to their specific posts or activities
- Maintain a ${messageSettings.professional >= 3 ? 'professional' : 'casual'} tone
- ${messageSettings.language === 'ITA' ? 'Write in Italian' : 'Write in English'}

Format as a JSON array of objects with 'text' and 'context' fields.`;

    console.log('General Messages Prompt:', prompt);
    const content = await callAIApi(profileData, prompt, 'json', messageSettings.language);
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

  try {
    // First get the person summary
    const personSummary = await generateAIAnalysis(profileData, settings.language);
    console.log('Person Summary:', personSummary);
    
    // Extract interests for article and podcast search
    const interests = personSummary.interests.length > 0 
      ? personSummary.interests 
      : ['technology', 'professional development', 'innovation'];

    // Generate article recommendation
    const articleRecommendation = await searchRecentArticles(profileData, interests, settings);

    // Generate podcast recommendation
    const podcastRecommendation = await searchPodcasts(profileData, interests, settings);

    // Generate general messages
    const generalMessages = await generateGeneralMessages(profileData, personSummary, settings);

    return {
      personSummary,
      articleRecommendation,
      podcastRecommendation,
      generalMessages
    };
  } catch (error) {
    console.error('Error generating recommendation:', error);
    throw error;
  }
} 