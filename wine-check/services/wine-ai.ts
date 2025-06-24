import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { Wine, Language } from "@/types/wine"
import { getWineRecommendations, getFoodPairingSuggestions } from "@/utils/wine-utils"

export interface WineQuery {
  message: string
  language: Language
  wines: Wine[]
}

export interface WineResponse {
  message: string
  recommendations?: Wine[]
  foodPairings?: string[]
  needsMoreInfo?: boolean
}

export async function getWineAdvice(query: WineQuery): Promise<WineResponse> {
  const { message, language, wines } = query

  // Extract preferences from the message
  const preferences = extractPreferences(message)

  // Check if we need more information
  if (
    !preferences.color &&
    !preferences.priceRange &&
    !preferences.food &&
    !preferences.occasion &&
    !message.toLowerCase().includes("recommend") &&
    !message.toLowerCase().includes("suggest")
  ) {
    return {
      message: getAskForPreferencesMessage(language),
      needsMoreInfo: true,
    }
  }

  // Get wine recommendations based on preferences
  const recommendations = getWineRecommendations(wines, preferences, 4)

  // Generate AI response
  const systemPrompt = getSystemPrompt(language, wines)
  const userPrompt = `User message: "${message}"

Available wines (sample): ${JSON.stringify(recommendations.slice(0, 3), null, 2)}

Please provide wine advice and recommendations based on the user's request. Include specific wine names from the available wines and explain why they're good choices. Keep the response concise and helpful.`

  try {
    // Create OpenAI client with the API key
    const openaiClient = openai({
      apiKey:
        process.env.OPENAI_API_KEY ||
        "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",
    })

    const { text } = await generateText({
      model: openaiClient("gpt-4o"),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 400,
    })

    // Get food pairings if we have wine color preference
    let foodPairings: string[] = []
    if (preferences.color) {
      foodPairings = getFoodPairingSuggestions(preferences.color)
    }

    return {
      message: text,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      foodPairings: foodPairings.length > 0 ? foodPairings : undefined,
    }
  } catch (error) {
    console.error("AI service error:", error)
    // Fallback to non-AI response if API fails
    return {
      message: generateFallbackResponse(message, preferences, recommendations, language),
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    }
  }
}

function generateFallbackResponse(
  message: string,
  preferences: any,
  recommendations: Wine[],
  language: Language,
): string {
  const responses = {
    en: {
      greeting: "I'd be happy to help you find the perfect wine!",
      colorPreference: preferences.color ? `Looking for ${preferences.color} wines` : "",
      pricePreference: preferences.priceRange ? `in the ${preferences.priceRange} price range` : "",
      foundWines:
        recommendations.length > 0
          ? `I found ${recommendations.length} excellent options for you:`
          : "Let me suggest some wines from our selection:",
      wineDetails:
        recommendations.length > 0
          ? recommendations.map((wine) => `• ${wine.productName} - €${wine.price}`).join("\n")
          : "",
      closing: "These wines are available at Delhaize and would be perfect for your needs!",
    },
    fr: {
      greeting: "Je serais ravi de vous aider à trouver le vin parfait !",
      colorPreference: preferences.color
        ? `Recherche de vins ${preferences.color === "red" ? "rouges" : preferences.color === "white" ? "blancs" : preferences.color === "rose" ? "rosés" : "effervescents"}`
        : "",
      pricePreference: preferences.priceRange
        ? `dans la gamme de prix ${preferences.priceRange === "budget" ? "économique" : preferences.priceRange === "mid" ? "moyenne" : preferences.priceRange === "premium" ? "premium" : "luxe"}`
        : "",
      foundWines:
        recommendations.length > 0
          ? `J'ai trouvé ${recommendations.length} excellentes options pour vous :`
          : "Permettez-moi de vous suggérer quelques vins de notre sélection :",
      wineDetails:
        recommendations.length > 0
          ? recommendations.map((wine) => `• ${wine.productName} - €${wine.price}`).join("\n")
          : "",
      closing: "Ces vins sont disponibles chez Delhaize et seraient parfaits pour vos besoins !",
    },
    nl: {
      greeting: "Ik help u graag de perfecte wijn te vinden!",
      colorPreference: preferences.color
        ? `Op zoek naar ${preferences.color === "red" ? "rode" : preferences.color === "white" ? "witte" : preferences.color === "rose" ? "rosé" : "mousserende"} wijnen`
        : "",
      pricePreference: preferences.priceRange
        ? `in het ${preferences.priceRange === "budget" ? "budget" : preferences.priceRange === "mid" ? "middensegment" : preferences.priceRange === "premium" ? "premium" : "luxe"} prijsbereik`
        : "",
      foundWines:
        recommendations.length > 0
          ? `Ik heb ${recommendations.length} uitstekende opties voor u gevonden:`
          : "Laat me enkele wijnen uit onze selectie voorstellen:",
      wineDetails:
        recommendations.length > 0
          ? recommendations.map((wine) => `• ${wine.productName} - €${wine.price}`).join("\n")
          : "",
      closing: "Deze wijnen zijn verkrijgbaar bij Delhaize en zouden perfect zijn voor uw behoeften!",
    },
  }

  const resp = responses[language]

  let response = resp.greeting

  if (resp.colorPreference) {
    response += ` ${resp.colorPreference}`
  }

  if (resp.pricePreference) {
    response += ` ${resp.pricePreference}`
  }

  response += `.\n\n${resp.foundWines}`

  if (resp.wineDetails) {
    response += `\n\n${resp.wineDetails}`
  }

  response += `\n\n${resp.closing}`

  return response
}

function extractPreferences(message: string) {
  const lowerMessage = message.toLowerCase()

  let color: any = undefined
  let priceRange: any = undefined
  let food = ""
  let occasion = ""

  // Extract wine color
  if (
    lowerMessage.includes("red") ||
    lowerMessage.includes("rouge") ||
    lowerMessage.includes("rood") ||
    lowerMessage.includes("cabernet") ||
    lowerMessage.includes("merlot") ||
    lowerMessage.includes("syrah")
  ) {
    color = "red"
  } else if (
    lowerMessage.includes("white") ||
    lowerMessage.includes("blanc") ||
    lowerMessage.includes("wit") ||
    lowerMessage.includes("chardonnay") ||
    lowerMessage.includes("sauvignon")
  ) {
    color = "white"
  } else if (lowerMessage.includes("rosé") || lowerMessage.includes("rose") || lowerMessage.includes("gris")) {
    color = "rose"
  } else if (
    lowerMessage.includes("sparkling") ||
    lowerMessage.includes("champagne") ||
    lowerMessage.includes("mousseux") ||
    lowerMessage.includes("brut")
  ) {
    color = "sparkling"
  }

  // Extract price range with more specific terms
  if (
    lowerMessage.includes("budget") ||
    lowerMessage.includes("cheap") ||
    lowerMessage.includes("économique") ||
    lowerMessage.includes("under 10") ||
    lowerMessage.includes("moins de 10")
  ) {
    priceRange = "budget"
  } else if (
    lowerMessage.includes("premium") ||
    lowerMessage.includes("expensive") ||
    lowerMessage.includes("cher") ||
    lowerMessage.includes("over 25") ||
    lowerMessage.includes("plus de 25")
  ) {
    priceRange = "premium"
  } else if (
    lowerMessage.includes("luxury") ||
    lowerMessage.includes("luxe") ||
    lowerMessage.includes("over 50") ||
    lowerMessage.includes("plus de 50")
  ) {
    priceRange = "luxury"
  } else if (lowerMessage.includes("mid") || lowerMessage.includes("medium") || lowerMessage.includes("moyen")) {
    priceRange = "mid"
  }

  // Extract food mentions
  const foodKeywords = [
    "meat",
    "fish",
    "cheese",
    "pasta",
    "chicken",
    "beef",
    "seafood",
    "dessert",
    "viande",
    "poisson",
    "fromage",
    "pâtes",
    "poulet",
    "bœuf",
    "fruits de mer",
  ]
  for (const keyword of foodKeywords) {
    if (lowerMessage.includes(keyword)) {
      food += keyword + " "
    }
  }

  // Extract occasion
  const occasionKeywords = ["dinner", "party", "celebration", "romantic", "wedding", "dîner", "fête", "célébration"]
  for (const keyword of occasionKeywords) {
    if (lowerMessage.includes(keyword)) {
      occasion += keyword + " "
    }
  }

  return { color, priceRange, food: food.trim(), occasion: occasion.trim() }
}

function getSystemPrompt(language: Language, wines: Wine[]): string {
  const prompts = {
    en: `You are a professional wine sommelier for Delhaize. You have access to their current wine selection and provide expert advice on wine selection, food pairings, and wine knowledge. 

Your personality:
- Knowledgeable but approachable
- Enthusiastic about wine
- Helpful and patient
- Professional yet friendly

Guidelines:
- Always recommend specific wines from the available selection
- Explain why each wine is a good choice
- Consider the user's preferences, budget, and occasion
- Provide food pairing suggestions when relevant
- Keep responses concise but informative
- Include wine details like region, grape variety, and tasting notes when possible`,

    fr: `Vous êtes un sommelier professionnel pour Delhaize. Vous avez accès à leur sélection actuelle de vins et fournissez des conseils d'expert sur la sélection de vins, les accords mets-vins, et les connaissances vinicoles.

Votre personnalité:
- Compétent mais accessible
- Enthousiaste à propos du vin
- Serviable et patient
- Professionnel mais amical

Directives:
- Recommandez toujours des vins spécifiques de la sélection disponible
- Expliquez pourquoi chaque vin est un bon choix
- Considérez les préférences, le budget et l'occasion de l'utilisateur
- Fournissez des suggestions d'accords mets-vins quand c'est pertinent
- Gardez les réponses concises mais informatives
- Incluez les détails du vin comme la région, le cépage, et les notes de dégustation quand possible`,

    nl: `U bent een professionele wijn sommelier voor Delhaize. U heeft toegang tot hun huidige wijnselectie en geeft deskundig advies over wijnselectie, wijn-spijs combinaties, en wijnkennis.

Uw persoonlijkheid:
- Deskundig maar benaderbaar
- Enthousiast over wijn
- Behulpzaam en geduldig
- Professioneel maar vriendelijk

Richtlijnen:
- Beveel altijd specifieke wijnen aan uit de beschikbare selectie
- Leg uit waarom elke wijn een goede keuze is
- Houd rekening met de voorkeuren, budget en gelegenheid van de gebruiker
- Geef wijn-spijs combinatie suggesties wanneer relevant
- Houd antwoorden beknopt maar informatief
- Voeg wijndetails toe zoals regio, druivensoort, en proefnotities wanneer mogelijk`,
  }

  return prompts[language]
}

function getAskForPreferencesMessage(language: Language): string {
  const messages = {
    en: "I'd be happy to help you find the perfect wine! To give you the best recommendations, could you tell me:\n\n• What color wine do you prefer? (Red, White, Rosé, or Sparkling)\n• What's your budget range? (Budget: €0-10, Mid-range: €10-25, Premium: €25-50, Luxury: €50+)\n• What's the occasion or what food will you be pairing it with?",
    fr: "Je serais ravi de vous aider à trouver le vin parfait ! Pour vous donner les meilleures recommandations, pourriez-vous me dire :\n\n• Quelle couleur de vin préférez-vous ? (Rouge, Blanc, Rosé, ou Effervescent)\n• Quelle est votre gamme de budget ? (Économique : €0-10, Milieu de gamme : €10-25, Premium : €25-50, Luxe : €50+)\n• Quelle est l'occasion ou avec quels plats l'accompagnerez-vous ?",
    nl: "Ik help u graag de perfecte wijn te vinden! Om u de beste aanbevelingen te geven, kunt u me vertellen:\n\n• Welke wijnkleur heeft uw voorkeur? (Rood, Wit, Rosé, of Mousserende)\n• Wat is uw budgetbereik? (Budget: €0-10, Middensegment: €10-25, Premium: €25-50, Luxe: €50+)\n• Wat is de gelegenheid of bij welk eten wilt u de wijn combineren?",
  }

  return messages[language]
}

function getFallbackMessage(language: Language, recommendations: Wine[]): string {
  const messages = {
    en: `Based on your preferences, here are some excellent wine options from our selection:`,
    fr: `Basé sur vos préférences, voici d'excellentes options de vin de notre sélection :`,
    nl: `Op basis van uw voorkeuren zijn hier enkele uitstekende wijnopties uit onze selectie:`,
  }

  return messages[language]
}
