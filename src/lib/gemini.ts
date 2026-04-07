import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    doshaAnalysis: {
      type: Type.OBJECT,
      properties: {
        dominantDosha: { type: Type.STRING },
        explanation: { type: Type.STRING },
        levels: {
          type: Type.OBJECT,
          properties: {
            vata: { type: Type.NUMBER },
            pitta: { type: Type.NUMBER },
            kapha: { type: Type.NUMBER },
          }
        }
      },
      required: ["dominantDosha", "explanation", "levels"]
    },
    ayurvedicInsight: { type: Type.STRING },
    remedies: {
      type: Type.OBJECT,
      properties: {
        homeRemedies: { type: Type.ARRAY, items: { type: Type.STRING } },
        herbs: { type: Type.ARRAY, items: { type: Type.STRING } },
        therapies: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["homeRemedies", "herbs", "therapies"]
    },
    dietPlan: {
      type: Type.OBJECT,
      properties: {
        avoid: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommended: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["avoid", "recommended"]
    },
    lifestyleGuidance: {
      type: Type.OBJECT,
      properties: {
        dinacharya: { type: Type.STRING },
        sleep: { type: Type.STRING },
        yoga: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["dinacharya", "sleep", "yoga"]
    },
    dosAndDonts: {
      type: Type.OBJECT,
      properties: {
        dos: { type: Type.ARRAY, items: { type: Type.STRING } },
        donts: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["dos", "donts"]
    },
    suggestedProducts: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING, enum: ["Tablet", "Syrup", "Powder", "Oil", "Capsule"] },
          price: { type: Type.STRING, description: "Approximate price in INR, e.g., ₹299" },
          rating: { type: Type.NUMBER, description: "Rating out of 5, e.g., 4.5" },
          imageSearchTerm: { type: Type.STRING }
        },
        required: ["name", "description", "category", "price", "rating", "imageSearchTerm"]
      } 
    },
    articles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING }
        },
        required: ["title", "summary"]
      }
    },
    disclaimer: { type: Type.STRING }
  },
  required: ["doshaAnalysis", "ayurvedicInsight", "remedies", "dietPlan", "lifestyleGuidance", "dosAndDonts", "suggestedProducts", "articles", "disclaimer"]
};

export const analyzeHealthProfile = async (profile: any, language: string = 'en') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is not configured. Please add it to your environment variables.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Analyze the following health profile from an Ayurvedic perspective:
    Age: ${profile.age}
    Gender: ${profile.gender}
    Weight: ${profile.weight || 'Not provided'}
    Lifestyle: ${profile.lifestyle}
    Medical History: ${profile.medicalHistory || 'None'}
    Current Symptoms: ${profile.currentSymptoms}
    Duration: ${profile.duration || 'Not specified'}

    Language: ${language === 'hi' ? 'Hindi' : 'English'}

    Please provide a structured response in JSON format with the following fields:
    1. doshaAnalysis: { 
         dominantDosha: string, 
         explanation: string, 
         levels: { vata: number, pitta: number, kapha: number } 
       }
    2. ayurvedicInsight: string (What's happening in the body)
    3. remedies: { 
         homeRemedies: string[], 
         herbs: string[], 
         therapies: string[] 
       }
    4. dietPlan: { 
         avoid: string[], 
         recommended: string[] 
       }
    5. lifestyleGuidance: { 
         dinacharya: string, 
         sleep: string, 
         yoga: string[] 
       }
    6. dosAndDonts: { 
         dos: string[], 
         donts: string[] 
       }
    7. suggestedProducts: { 
         name: string, 
         description: string, 
         category: "Tablet" | "Syrup" | "Powder" | "Oil" | "Capsule",
         imageSearchTerm: string (A descriptive name to find a high-quality Ayurvedic product image)
       }[] (3-4 Ayurvedic products available on Amazon)
    8. articles: { 
         title: string, 
         summary: string 
       }[] (2-3 short educational articles related to the user's condition)
    9. disclaimer: string (A medical disclaimer)

    IMPORTANT: 
    - Use a simple, friendly tone.
    - Avoid heavy medical jargon.
    - Do not make guaranteed cure claims.
    - If language is Hindi, provide all text in Hindi.
    - Ensure the response is a valid JSON object matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA as any,
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const analyzeBodyScan = async (base64Image: string, language: string = 'en') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is not configured.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  // Extract base64 data and mime type
  const [header, data] = base64Image.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

  const prompt = `
    Analyze this image from an Ayurvedic perspective. The image may show skin, tongue, or other physical markers.
    Identify visual patterns related to Vata, Pitta, or Kapha imbalances.
    
    Language: ${language === 'hi' ? 'Hindi' : 'English'}

    Please provide a structured response in JSON format with the following fields:
    1. doshaAnalysis: { 
         dominantDosha: string, 
         explanation: string (based on visual markers in the image), 
         levels: { vata: number, pitta: number, kapha: number } 
       }
    2. ayurvedicInsight: string (What the visual markers indicate about internal health)
    3. remedies: { 
         homeRemedies: string[], 
         herbs: string[], 
         therapies: string[] 
       }
    4. dietPlan: { 
         avoid: string[], 
         recommended: string[] 
       }
    5. lifestyleGuidance: { 
         dinacharya: string, 
         sleep: string, 
         yoga: string[] 
       }
    6. dosAndDonts: { 
         dos: string[], 
         donts: string[] 
       }
    7. suggestedProducts: { 
         name: string, 
         description: string, 
         category: "Tablet" | "Syrup" | "Powder" | "Oil" | "Capsule",
         imageSearchTerm: string
       }[]
    8. articles: { title: string, summary: string }[]
    9. disclaimer: string

    IMPORTANT: 
    - Focus on visual analysis.
    - If language is Hindi, provide all text in Hindi.
    - Ensure the response is a valid JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { data, mimeType } }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA as any,
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Body Scan Error:", error);
    throw error;
  }
};

export const generateProductSketch = async (productName: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A minimalist, elegant pencil sketch of an Ayurvedic product: ${productName}. 
            The style should be clean, botanical, and artistic, on a plain white background. 
            No text, no labels, just the artistic representation of the herb or medicine bottle.
            Make it look like a professional medical illustration from an ancient Ayurvedic text but modernized.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating sketch:", error);
    return null;
  }
};

export const analyzeFaceGlow = async (imageBase64: string, language: string = 'en') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is missing");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an Ayurvedic skincare assistant. Analyze the uploaded face image and provide a detailed skin glow analysis.
  
  IMPORTANT: 
  - Do NOT provide medical diagnosis.
  - Use cautious language like "may", "could be", "might indicate".
  - Keep the tone helpful, supportive, and Ayurvedic.
  - Respond in ${language === 'hi' ? 'Hindi' : 'English'}.

  Return the response in the following JSON format:
  {
    "glowScore": number (0-100),
    "hydrationLevel": "Low" | "Medium" | "Good",
    "observations": [
      { "title": string, "description": string }
    ],
    "possibleCauses": [
      { "title": string, "description": string }
    ],
    "suggestions": {
      "diet": [string],
      "skincare": [string],
      "habits": [string]
    },
    "recommendedProducts": [
      {
        "name": string,
        "benefit": string,
        "category": "Cream" | "Oil" | "Face Wash" | "Pack",
        "price": string,
        "rating": number,
        "imageSearchTerm": string
      }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.split(',')[1] || imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      },
    });

    const text = response.text;
    return JSON.parse(text);
  } catch (error) {
    console.error("Face Glow Analysis Error:", error);
    throw error;
  }
};

export const analyzeFutureHealth = async (userData: any, language: string = 'en') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is missing");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an Ayurvedic health predictor. Based on the user's data, predict their health risks and wellness outlook for the next 30 days.
  
  User Data:
  - Language: ${language}
  - Profile Info: ${JSON.stringify(userData)}

  IMPORTANT: 
  - Do NOT provide medical diagnosis.
  - Use cautious language like "may", "could be", "might indicate".
  - Keep the tone helpful, supportive, and Ayurvedic.
  - Respond in ${language === 'hi' ? 'Hindi' : 'English'}.

  Return the response in the following JSON format:
  {
    "outlook": string (Overall 30-day outlook),
    "riskLevel": "Low" | "Medium" | "High",
    "predictions": [
      { "period": "Week 1-2", "focus": string, "risk": string, "remedy": string }
    ],
    "doshaBalance": {
      "vata": number,
      "pitta": number,
      "kapha": number
    },
    "keyWarnings": [string],
    "recommendedActions": [string]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      },
    });

    const text = response.text;
    return JSON.parse(text);
  } catch (error) {
    console.error("Future Health Prediction Error:", error);
    throw error;
  }
};

export const analyzeMoodAyurveda = async (mood: string, language: string = 'en') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is missing");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an Ayurvedic mood expert. Based on the user's selected mood, provide a holistic Ayurvedic remedy.
  
  User Mood: ${mood}
  Language: ${language}

  IMPORTANT: 
  - Do NOT provide medical diagnosis.
  - Keep the tone helpful, supportive, and Ayurvedic.
  - Respond in ${language === 'hi' ? 'Hindi' : 'English'}.

  Return the response in the following JSON format:
  {
    "remedy": string (Overall Ayurvedic remedy),
    "drink": string (Recommended Ayurvedic drink),
    "activity": string (Recommended activity like Yoga or Pranayama),
    "diet": [string],
    "doshaImpact": string (How this mood affects Vata/Pitta/Kapha)
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      },
    });

    const text = response.text;
    return JSON.parse(text);
  } catch (error) {
    console.error("Mood Ayurveda Analysis Error:", error);
    throw error;
  }
};
