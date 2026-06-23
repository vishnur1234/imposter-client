import ai from "./gemini";
import topics from "./demoData";

export async function generateTopic(course) {
  if (!ai) {
    console.warn("Gemini API key is not configured. Falling back to local demo data.");
    const randomIndex = Math.floor(Math.random() * topics.length);
    return topics[randomIndex];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Generate one ${course} imposter game topic.

Return ONLY valid JSON.

{
  "answer":"",
  "clues":["","","",""]
}
`,
      config: {
        responseMimeType: "application/json",
      },
    });

    let cleanText = response.text.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(?:json)?\n?/i, "").replace(/```$/, "").trim();
    }

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini API call failed, falling back to local demo data:", error);
    const randomIndex = Math.floor(Math.random() * topics.length);
    return topics[randomIndex];
  }
}