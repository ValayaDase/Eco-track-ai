import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY is not defined in environment variables");
}

const ai = new GoogleGenAI({ apiKey });

export interface RecommendationAIResult {
  title: string;
  description: string;
  category: "transport" | "energy" | "food" | "waste" | "shopping";
  estimatedSavings: number; // in kg CO2 per month
  priority: "high" | "medium" | "low";
  difficulty: "easy" | "medium" | "hard";
}

export interface ReportAIResult {
  summary: string;
  recommendations: string[];
}

/**
 * Generate lifestyle suggestions based on carbon profiles and daily logging trends.
 */
export async function getAIRecommendations(
  profileText: string,
  activitiesText: string,
  segment: string
): Promise<RecommendationAIResult[]> {
  if (!apiKey) {
    return getFallbackRecommendations();
  }

  try {
    const prompt = `You are a carbon footprint and sustainability consultant. 
    Analyze this user's profile, recent carbon activities, and their dynamic lifestyle segment.
    
    The user is classified under the lifestyle segment: "${segment}".
    - If they are 'Eco-Novice', provide simple, easy, high-impact introductory carbon reduction tips.
    - If they are 'Sustainable Commuter', praise their low-emissions transit habits and suggest recommendations primarily in food, waste, shopping, or energy.
    - If they are 'Energy Conscious', praise their green utility usage and focus on travel, diet, or waste.
    - If they are 'Conscious Consumer', praise their plastic-saving and item-reduction actions and suggest transit or energy savings.
    - If they are 'Low-Impact Pioneer', offer advanced sustainability techniques (e.g. smart grid integration, home insulation, solar, composting).
    
    Generate 4 distinct, personalized, highly actionable carbon reduction tips or behavioral nudges.
    
    Format the response strictly as a valid JSON array of objects, containing NO markdown syntax wrapping, NO markdown backticks, and NO trailing characters.
    
    TypeScript interface for each object:
    interface Recommendation {
      title: string; // e.g. "Switch to a vegan lunch three times a week"
      description: string; // Explains how to execute it and the environmental benefit.
      category: "transport" | "energy" | "food" | "waste" | "shopping";
      estimatedSavings: number; // estimated monthly kg CO2 saved (integer number e.g. 15)
      priority: "high" | "medium" | "low";
      difficulty: "easy" | "medium" | "hard";
    }

    User Profile:
    ${profileText}

    Recent Logs:
    ${activitiesText}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = response.text || "";
    const cleanText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText) as RecommendationAIResult[];
  } catch (error) {
    console.error("Gemini AI Recommendations compilation error:", error);
    return getFallbackRecommendations();
  }
}

/**
 * Generate analytical summaries for weekly/monthly carbon logs.
 */
export async function getAIReport(
  profileText: string,
  recordsText: string,
  period: "weekly" | "monthly"
): Promise<ReportAIResult> {
  if (!apiKey) {
    return getFallbackReport(period);
  }

  try {
    const prompt = `You are a data analyst specializing in climate science.
    Analyze the user's carbon emission logs for this past ${period}.
    Generate a JSON report summarizing their strengths, major emission sources, areas needing improvement, and 3 specific goals for next time.
    
    Format the response strictly as a valid JSON object, containing NO markdown syntax wrapping, NO markdown backticks, and NO trailing characters.
    
    TypeScript interface:
    interface Report {
      summary: string; // A 2-3 sentence paragraph summarizing their performance and trends.
      recommendations: string[]; // Exactly 3 clear, actionable goals for next week/month.
    }

    User Profile:
    ${profileText}

    Emission records for the period:
    ${recordsText}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = response.text || "";
    const cleanText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText) as ReportAIResult;
  } catch (error) {
    console.error("Gemini AI Report compilation error:", error);
    return getFallbackReport(period);
  }
}

// Fallback suggestions if Gemini fails or is unconfigured
function getFallbackRecommendations(): RecommendationAIResult[] {
  return [
    {
      title: "Replace short car trips with walking or cycling",
      description: "Driving accounts for significant carbon outputs. For any errands under 2 kilometers, consider walking or riding a bicycle.",
      category: "transport",
      estimatedSavings: 18,
      priority: "high",
      difficulty: "easy",
    },
    {
      title: "Reduce standby power draw",
      description: "Unplug chargers and media systems when leaving the house. Standby usage contributes to baseline home energy loads.",
      category: "energy",
      estimatedSavings: 8,
      priority: "medium",
      difficulty: "easy",
    },
    {
      title: "Integrate Meatless Mondays",
      description: "Skipping red meat just one day a week decreases food-related emissions. Livestock farming is highly resource-intensive.",
      category: "food",
      estimatedSavings: 15,
      priority: "high",
      difficulty: "easy",
    },
    {
      title: "Adopt a 'one-in, one-out' shopping policy",
      description: "Before purchasing new items, check if you can repair or do without. Extends lifecycle of goods and reduces manufacturing carbon.",
      category: "shopping",
      estimatedSavings: 12,
      priority: "medium",
      difficulty: "medium",
    },
  ];
}

function getFallbackReport(period: string): ReportAIResult {
  return {
    summary: `Your emissions for this ${period} show standard baseline averages. Transportation remains your primary contributor. Minor shifts toward active commuting and local diets would lower your footprint significantly.`,
    recommendations: [
      "Aim to complete at least 2 public transport challenges this upcoming period.",
      "Switch at least three meals to plant-based options.",
      "Track your energy metrics consistently to pinpoint standby leakage."
    ]
  };
}
