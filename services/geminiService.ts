import { GoogleGenAI, Type } from "@google/genai";

export const generateBirthdayContent = async (name: string, relationship: string, memories: string): Promise<any> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Based on the following information, generate heartfelt and romantic content for a special birthday website.
        - Recipient's Name: ${name}
        - My Relationship with them: ${relationship}
        - Key Memories/Feelings: "${memories}"

        The tone should be modern, deeply personal, and emotional. Adhere to the requested JSON schema. 
        The letter should be a longer, heartfelt message (2-3 paragraphs) that expands on the feelings and memories provided.
        The final message should be a short, impactful sign-off.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        welcomeMessage: { type: Type.STRING, description: "A short, sweet welcome message. e.g., 'I built a little world for you...'" },
                        birthdayMessage: { type: Type.STRING, description: "A message wishing them a happy birthday. e.g., 'Another year of you making the world brighter...'" },
                        bentoItems: {
                            type: Type.ARRAY,
                            description: "Generate 3 to 5 distinct, positive attributes or 'reasons I adore you'.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    icon: { type: Type.STRING, description: "A single, relevant emoji for the title." },
                                    title: { type: Type.STRING, description: "A short title for the attribute (e.g., 'Your Radiant Spirit')." },
                                    text: { type: Type.STRING, description: "A short sentence elaborating on the attribute." },
                                },
                                required: ["icon", "title", "text"]
                            }
                        },
                        wishMessage: { type: Type.STRING, description: "A forward-looking wish for their year ahead. e.g., 'May the next year bring you all the love...'" },
                        letter: { type: Type.STRING, description: "A heartfelt letter to the recipient, 2-3 paragraphs long." },
                        // FIX: Removed trailing double quote from description string.
                        finalMessage: { type: Type.STRING, description: `A short, final birthday sign-off. e.g., 'Happy Birthday, ${name}! ❤️'` },
                    },
                    required: ["welcomeMessage", "birthdayMessage", "bentoItems", "wishMessage", "letter", "finalMessage"]
                },
            }
        });
        const jsonText = response.text?.trim();
        if (jsonText) {
            return JSON.parse(jsonText);
        } else {
            throw new Error("AI returned an empty response.");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate content from AI service. Please check your inputs.");
    }
};