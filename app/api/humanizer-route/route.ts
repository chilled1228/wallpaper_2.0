import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/firebase-admin";
import { getFirestore } from 'firebase-admin/firestore';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const db = getFirestore(adminApp);

async function getUserCredits(userId: string): Promise<number> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('User document not found');
    }
    return userDoc.data()?.credits || 0;
  } catch (error) {
    console.error('Error getting user credits:', error);
    throw error;
  }
}

async function updateUserCredits(userId: string, newCredits: number) {
  try {
    if (newCredits < 0) {
      throw new Error('Credits cannot be negative');
    }
    await db.collection('users').doc(userId).update({
      credits: newCredits,
      updatedAt: new Date(),
    });
    console.log('Updated credits for user:', userId, 'New credits:', newCredits);
  } catch (error) {
    console.error('Error updating user credits:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    try {
      const decodedToken = await getAuth(adminApp).verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check user's credits
    let credits: number;
    try {
      credits = await getUserCredits(userId);
      console.log('Retrieved credits for user:', userId, 'Credits:', credits);

      if (credits === 0) {
        return NextResponse.json(
          { error: 'Insufficient Credits', message: 'No credits remaining. Please purchase more credits.' },
          { status: 403 }
        );
      }

      // Update credits BEFORE generating content to prevent usage without credits
      await updateUserCredits(userId, credits - 1);
      console.log('Successfully updated credits for user:', userId, 'New credits:', credits - 1);
    } catch (error) {
      console.error('Error checking/updating user credits:', error);
      return NextResponse.json(
        { error: 'Credit Check Failed', message: 'Unable to verify user credits' },
        { status: 500 }
      );
    }

    const {
      text,
      humanizationLevel,
      formalityLevel,
      useSpellingVariations,
      contextualAwareness,
      phraseRandomization,
      readabilityLevel,
    } = await req.json();

    // Validate inputs
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (text.length > 1000) {
      return NextResponse.json({ error: 'Text exceeds maximum length of 1000 characters' }, { status: 400 });
    }

    if (!humanizationLevel || !formalityLevel || !readabilityLevel) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Construct the prompt based on settings
    const prompt = `You will be given a piece of text that sounds like it was generated by AI. Your task is to rewrite this text to make it sound more human-written.

Settings to consider (each setting must significantly affect the output):
- Humanization Level: ${humanizationLevel}% (${humanizationLevel > 75 ? 'Use very casual, conversational language' : humanizationLevel > 50 ? 'Use natural, balanced language' : 'Keep it somewhat formal'})
- Formality Level: ${formalityLevel}% (${formalityLevel > 75 ? 'Use professional, sophisticated language' : formalityLevel > 50 ? 'Use standard business language' : 'Use casual language'})
- Use Spelling Variations: ${useSpellingVariations ? 'Yes - include common spelling variations and informal spellings when appropriate' : 'No - use standard spelling'}
- Contextual Awareness: ${contextualAwareness ? 'Yes - adapt tone and style to the context' : 'No - maintain consistent tone'}
- Phrase Randomization: ${phraseRandomization ? 'Yes - vary sentence structures and use diverse phrasings' : 'No - keep sentence structures consistent'}
- Readability Level: ${readabilityLevel} (${
      readabilityLevel === 'easy' ? 'Use simple words and short sentences (5th-6th grade level)'
      : readabilityLevel === 'medium' ? 'Use moderate complexity (8th-9th grade level)'
      : 'Use sophisticated vocabulary and complex sentences (11th-12th grade level)'
    })

Guidelines for rewriting:
1. Use a conversational tone, concise language and avoid unnecessarily complex jargon
2. Use short punchy sentences with natural breaks
3. Keep language simple (unless high formality is requested)
4. Use rhetorical fragments to improve readability
5. Use bullet points when relevant
6. Include analogies or examples where appropriate
7. Split up long sentences for better flow
8. Add a personal touch or anecdotal elements
9. Use emphasis naturally (like you would in real writing)
10. Avoid emojis, hashtags, and promotional buzzwords

Original text to humanize:
"${text}"

Important:
- If Humanization Level is high (${humanizationLevel}%), make it sound like a real person talking
- If Formality Level is high (${formalityLevel}%), maintain professionalism while staying natural
- If Spelling Variations is enabled (${useSpellingVariations}), use natural variations thoughtfully
- If Contextual Awareness is enabled (${contextualAwareness}), adapt the style to the content
- If Phrase Randomization is enabled (${phraseRandomization}), use varied expressions
- For ${readabilityLevel} readability, adjust vocabulary and sentence complexity accordingly

Return only the humanized text without any explanations or additional formatting.`;

    console.log('Processing text with settings:', {
      textLength: text.length,
      humanizationLevel,
      formalityLevel,
      useSpellingVariations,
      contextualAwareness,
      phraseRandomization,
      readabilityLevel
    });

    // Generate the response
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text_response = response.text();

    console.log('Successfully processed text');

    return NextResponse.json({ 
      output: text_response,
      creditsRemaining: credits - 1
    });

  } catch (error) {
    console.error('Error in humanizer route:', error);
    return NextResponse.json(
      { error: 'Failed to process text' },
      { status: 500 }
    );
  }
} 