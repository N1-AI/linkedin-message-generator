import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { lengthStyles, formalityStyles } from '@/lib/message-styles';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt, format = 'text', length = 2, formality = 2, language = 'ENG' } = await req.json();
    
    console.log('AI API Request:', { prompt, format, length, formality, language });

    if (!openai.apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get the style guidelines based on length and formality
    const lengthStyle = lengthStyles[length];
    const formalityStyle = formalityStyles[formality];

    // Create the system message with style guidelines
    const systemMessage = `You are a helpful assistant that generates ${formalityStyle.description} messages ${language === 'ITA' ? 'in Italian' : 'in English'}.

Key Style Guidelines:
Length: ${lengthStyle.description}
${lengthStyle.guidelines.map(g => `- ${g}`).join('\n')}

Tone: ${formalityStyle.description}
${formalityStyle.guidelines.map(g => `- ${g}`).join('\n')}

Critical Rules:
1. NEVER directly reference seeing their posts/activity/profile
2. Instead, allude to topics naturally as if from shared knowledge
3. Make connections feel organic and conversational
4. Avoid phrases like "I noticed", "I saw", "your post about", etc.
5. When including URLs, use {url} as a placeholder
6. Format numbers as strings if they appear in JSON
7. ${format === 'json' ? 'Always respond with valid JSON' : 'Write natural, conversational messages'}
8. ${language === 'ITA' ? 'Respond ONLY in Italian, maintaining a natural and native-sounding tone' : 'Respond in English'}

Examples of good style for this level:
${lengthStyle.examples.map((ex, i) => `${i + 1}. "${ex}"`).join('\n')}

Examples of appropriate tone:
${formalityStyle.examples.map((ex, i) => `${i + 1}. "${ex}"`).join('\n')}

${language === 'ITA' ? `Additional Italian Language Guidelines:
1. Use proper Italian grammar and punctuation
2. Maintain natural Italian expressions and idioms
3. Adapt formality levels to Italian cultural norms
4. Use appropriate Italian business language when needed
5. Keep regional variations neutral (standard Italian)` : ''}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json({ error: 'No content in AI response' }, { status: 500 });
    }

    // For JSON responses, validate the JSON before sending
    if (format === 'json') {
      try {
        const parsed = JSON.parse(content);
        return NextResponse.json({ result: parsed });
      } catch (e) {
        console.error('Failed to parse AI JSON response:', content);
        return NextResponse.json({ error: 'Invalid JSON in AI response' }, { status: 500 });
      }
    }

    return NextResponse.json({ result: content });
  } catch (error) {
    console.error('Error in AI API:', error);
    return NextResponse.json(
      { error: 'Error processing AI request' },
      { status: 500 }
    );
  }
} 