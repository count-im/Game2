
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateCombatDescription = async (
  attackerName: string,
  targetName: string,
  damage: number,
  isPlayer: boolean
): Promise<string> => {
  try {
    const prompt = `Write a one-sentence dramatic Star Wars lightsaber combat description. 
    ${attackerName} attacks ${targetName} dealing ${damage} damage. 
    The tone should be epic. 
    ${isPlayer ? 'The player (Jedi) is attacking.' : 'The villain is attacking.'}
    Use terms like 'parry', 'strike', 'Force', 'lightsaber hum', 'clash of blades'.
    Keep it under 25 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.8,
        maxOutputTokens: 60,
      }
    });

    return response.text.trim() || `${attackerName} strikes ${targetName} for ${damage} damage!`;
  } catch (error) {
    console.error("Gemini Error:", error);
    return `${attackerName} strikes ${targetName} for ${damage} damage!`;
  }
};

export const generateVictoryMessage = async (playerName: string): Promise<string> => {
  try {
    const prompt = `Generate a short Star Wars victory message for a Jedi named ${playerName} who has defeated a Sith. Mention the Force being with them.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text.trim();
  } catch {
    return "The Force is strong with you. The galaxy is safer today.";
  }
};

export const generateBattleBackground = async (): Promise<string | null> => {
  const themes = [
    "A massive Death Star in the background of deep space with starships and X-wings flying around",
    "The legendary Sith Lord Darth Vader standing in a dark chamber with a red glow, dramatic silhouette",
    "Grand Master Yoda meditating in the luminous and misty swamp of Dagobah, cinematic lighting",
    "A legendary battleground on Mustafar with lava rivers and volcanic explosions",
    "The desert world of Tatooine with twin suns setting over a vast sand sea",
    "A fleet of Imperial Star Destroyers in a colorful nebula, epic space battle scale"
  ];
  
  const selectedTheme = themes[Math.floor(Math.random() * themes.length)];
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A cinematic, wide-angle concept art for Star Wars. Dark atmosphere. Theme: ${selectedTheme}. Professional digital painting style.` }]
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};
