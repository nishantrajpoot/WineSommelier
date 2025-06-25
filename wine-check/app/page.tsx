"use client"

import { useState, useEffect } from "react"
import { WineChatbot } from "@/components/wine-chatbot"
import { CartIndicator } from "@/components/cart-indicator"
import { Wine } from "lucide-react"
import wineData from "@/data/mock-data.json"
import type { Language } from "@/types/wine"

export default function Home() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [language, setLanguage] = useState<Language>("fr")

  // Listen for language changes from chatbot
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent<Language>) => {
      setLanguage(event.detail)
    }

    window.addEventListener("languageChange", handleLanguageChange as EventListener)

    return () => {
      window.removeEventListener("languageChange", handleLanguageChange as EventListener)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo page content */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <p className="text-lg text-gray-700 mb-4">welcome to delhaize wine selection page</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Delhaize Wine Sommelier Demo</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your virtual wine sommelier with access to {wineData.data.length} wines from Delhaize. Get personalized
            recommendations, food pairings, and expert wine advice in French, English, or Dutch. Add wines to your cart
            and shop seamlessly!
          </p>
        </div>

        {/* Sample content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2">50+ Wine Selection</h3>
            <p className="text-gray-600 text-sm">
              From budget-friendly options starting at €3.99 to premium wines over €70, including Champagne, Bordeaux,
              and international varieties.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2">AI-Powered Recommendations</h3>
            <p className="text-gray-600 text-sm">
              Get personalized wine suggestions based on your preferences, budget, and occasion using advanced AI.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Smart Cart Integration</h3>
            <p className="text-gray-600 text-sm">
              Add recommended wines to your cart and get direct links to each wine on Delhaize for easy shopping.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">How to Use the Wine Sommelier</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              <strong>1. Click the wine icon</strong> in the bottom right corner to open the chatbot.
            </p>
            <p>
              <strong>2. Choose your language</strong> (French, English, or Dutch) from the dropdown.
            </p>
            <p>
              <strong>3. Ask questions</strong> about wine recommendations, food pairings, or wine advice.
            </p>
            <p>
              <strong>4. Add wines to cart</strong> by clicking wine details and using "Add to Cart" button.
            </p>
            <p>
              <strong>5. View your cart</strong> using the green cart icon (appears when you have items).
            </p>
            <p>
              <strong>6. Shop on Delhaize</strong> with direct links to each wine or use the shopping list format.
            </p>
          </div>
        </div>
      </div>

      {/* Cart Indicator - now receives language from parent */}
      <CartIndicator language={language} />

      {/* Floating chat button */}
      {!isChatbotOpen && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors flex items-center justify-center z-40"
        >
          <Wine className="w-6 h-6" />
        </button>
      )}

      {/* Chatbot - now emits language changes */}
      <WineChatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} onLanguageChange={setLanguage} />
    </div>
  )
}
