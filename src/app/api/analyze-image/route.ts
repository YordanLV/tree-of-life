import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are an expert at identifying and naming subjects in images. Your task:\n\n1. FIRST, carefully check if the image contains any famous or well-known:\n   - People (celebrities, politicians, historical figures, etc.)\n   - Artworks\n   - NFTs\n   - Brands/logos\n   If you recognize any famous subject, you MUST use their real name/title.\n\n2. If no famous subject is found, analyze for:\n   - Non-famous people\n   - Animals\n   - Unknown artworks\n   - Objects/products\n   - Abstract art/patterns\n   - Landscapes/scenes\n\n3. Naming rules:\n   - Famous people: ALWAYS use real name (e.g., 'Elon Musk', 'Taylor Swift')\n   - Famous artworks: ALWAYS use real title and artist\n   - Non-famous people: Create fitting name based on appearance/vibe\n   - Animals: Create personality-matching name\n   - Unknown artworks: Create evocative title\n   - Objects: Give them character\n\n4. Return ONLY a JSON object with:\n   { name: string, personality: string, background: string }\n\n5. Context guidelines:\n   - Famous people/things: Use actual background and history\n   - Non-famous subjects: Create fitting fictional background\n\nNo explanations or additional text - just the JSON object.",
            },
            {
              type: "image_url",
              image_url: image,
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const generatedContent = response.choices[0]?.message?.content || "{}";
    let cleanedContent = generatedContent
      .replace(/```json\n?/, "")
      .replace(/```/, "")
      .trim();

    // Try to fix common issues that might prevent JSON parsing
    try {
      JSON.parse(cleanedContent);
    } catch (error) {
      console.log(error);
      // If parsing fails, attempt to extract JSON-like content
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      } else {
        // Fallback response if no valid JSON can be extracted
        cleanedContent = JSON.stringify({
          name: "Unknown",
          personality: "Mysteriously silent",
          background: "Lost in translation",
        });
      }
    }

    const persona = JSON.parse(cleanedContent);

    return NextResponse.json({ persona });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
