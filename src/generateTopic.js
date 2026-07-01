import ai from "./gemini";
import topics from "./demoData";

export async function generateTopic(course) {
  // Normalize the category selection for offline demo data fallback
  let normCourse = (course || "").toLowerCase();
  if (normCourse.startsWith("random_")) {
    normCourse = normCourse.replace("random_", "");
  }
  let categoryKey = "general";
  if (normCourse === "acca" || normCourse === "cma" || normCourse === "financial") {
    categoryKey = "financial";
  } else if (normCourse === "bank" || normCourse === "banking") {
    categoryKey = "bank";
  } else if (normCourse === "movie" || normCourse === "movies") {
    categoryKey = "movie";
  } else if (normCourse === "general") {
    categoryKey = "general";
  }

  if (!ai) {
    console.warn("Gemini API key is not configured. Falling back to local demo data.");
    const filteredTopics = topics.filter((t) => t.category === categoryKey);
    const useTopics = filteredTopics.length > 0 ? filteredTopics : topics;
    const randomIndex = Math.floor(Math.random() * useTopics.length);
    return useTopics[randomIndex];
  }

  try {
    let cleanCourse = course;
    if (typeof course === "string" && course.startsWith("random_")) {
      cleanCourse = course.replace("random_", "");
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Generate one imposter game topic from the ${cleanCourse} category.

Rules:
- If category is ACCA or CMA, generate finance, accounting, or business topics (like assets, ratios, standards, etc.).
- If category is Bank, generate banking, financial risk, or banking service topics (like collateral, interest rates, KYC, etc.).
- If category is Movie, generate popular movies, movie characters, or film concepts (like Inception, Harry Potter, Jurassic Park, etc.).
- If category is General, generate common everyday items, places, concepts, or food (like coffee, library, pizza, winter, etc.).
- Give only ONE clue.
- The clue should help the imposter guess the answer without being too obvious to everyone immediately.
- Return ONLY valid JSON matching this schema:

{
  "answer": "",
  "clue": ""
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
    const filteredTopics = topics.filter((t) => t.category === categoryKey);
    const useTopics = filteredTopics.length > 0 ? filteredTopics : topics;
    const randomIndex = Math.floor(Math.random() * useTopics.length);
    return useTopics[randomIndex];
  }
}