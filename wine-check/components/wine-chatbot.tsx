"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, X, Wine, RotateCcw } from "lucide-react"
import type { ChatMessage, Language, Wine as WineType } from "@/types/wine"
import { getTranslation } from "@/utils/translations"
import { WineCard } from "./wine-card"
import { suggestionsDB } from "@/utils/suggestions-db"
import wineData from "@/data/mock-data.json"

interface WineChatbotProps {
  isOpen: boolean
  onClose: () => void
  onLanguageChange?: (language: Language) => void
}

export function WineChatbot({ isOpen, onClose, onLanguageChange }: WineChatbotProps) {
  const [language, setLanguage] = useState<Language>("fr")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [currentRecommendations, setCurrentRecommendations] = useState<WineType[]>([])
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Only scroll to bottom for user messages, not assistant responses
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === "user") {
        scrollToBottom()
      }
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat()
    }
  }, [isOpen])

  // Update greeting message when language changes
  useEffect(() => {
    if (messages.length > 0) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === "greeting" ? { ...message, content: getTranslation(language, "greeting") } : message,
        ),
      )
    }
    // Update suggestions when language changes
    updateSuggestions()
  }, [language])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const updateSuggestions = () => {
    // Load dynamic suggestions for current language
    const topSuggestions = suggestionsDB.getTopSuggestions(language, 6)
    const fallbackSuggestions = suggestionsDB.getFallbackSuggestions(language)

    // Always ensure we have exactly 6 suggestions
    let finalSuggestions: string[] = []

    if (topSuggestions.length >= 6) {
      finalSuggestions = topSuggestions.slice(0, 6)
    } else {
      // Combine stored suggestions with fallbacks to get exactly 6
      finalSuggestions = [...topSuggestions]
      const needed = 6 - topSuggestions.length
      const availableFallbacks = fallbackSuggestions.filter(
        (fallback) => !topSuggestions.some((stored) => stored.toLowerCase().trim() === fallback.toLowerCase().trim()),
      )
      finalSuggestions.push(...availableFallbacks.slice(0, needed))
    }

    // If still not enough, pad with remaining fallbacks
    if (finalSuggestions.length < 6) {
      const remaining = 6 - finalSuggestions.length
      const allFallbacks = suggestionsDB.getFallbackSuggestions(language)
      for (let i = 0; i < remaining && i < allFallbacks.length; i++) {
        if (!finalSuggestions.includes(allFallbacks[i])) {
          finalSuggestions.push(allFallbacks[i])
        }
      }
    }

    setDynamicSuggestions(finalSuggestions.slice(0, 6))
  }

  const initializeChat = () => {
    // Add greeting message when chatbot opens
    const greetingMessage: ChatMessage = {
      id: "greeting",
      role: "assistant",
      content: getTranslation(language, "greeting"),
      timestamp: new Date(),
    }
    setMessages([greetingMessage])
    setShowSuggestions(true)
    updateSuggestions()
  }

  const clearChat = () => {
    setMessages([])
    setCurrentRecommendations([])
    setShowSuggestions(true)
    setInput("")
    initializeChat()
  }

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    // Notify parent component about language change
    onLanguageChange?.(newLanguage)

    // Emit custom event for other components
    window.dispatchEvent(new CustomEvent("languageChange", { detail: newLanguage }))

    // Reset suggestions when language changes
    if (messages.length === 1) {
      setShowSuggestions(true)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    setShowSuggestions(false)
    // Auto-submit the suggestion
    setTimeout(() => {
      const form = document.querySelector("form")
      if (form) {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
      }
    }, 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userQuery = input.trim()
    setShowSuggestions(false) // Hide suggestions after first message

    // Add query to suggestions database
    suggestionsDB.addQuery(userQuery, language)

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userQuery,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/wine-advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userQuery,
          language,
          wines: wineData.data as WineType[],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get wine advice")
      }

      const result = await response.json()

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Store recommendations for rendering
      if (result.recommendations && result.recommendations.length > 0) {
        setCurrentRecommendations(result.recommendations)
        const recommendationsMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "WINE_RECOMMENDATIONS",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, recommendationsMessage])
      }

      // Add food pairings if available
      if (result.foodPairings && result.foodPairings.length > 0) {
        const pairingsMessage: ChatMessage = {
          id: (Date.now() + 3).toString(),
          role: "assistant",
          content: `FOOD_PAIRINGS:${result.foodPairings.join("|")}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, pairingsMessage])
      }
    } catch (error) {
      console.error("Error getting wine advice:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const renderMessage = (message: ChatMessage) => {
    if (message.content === "WINE_RECOMMENDATIONS") {
      return (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">{getTranslation(language, "recommendations")}</h4>
          {currentRecommendations.map((wine) => (
            <WineCard key={wine._id} wine={wine} language={language} />
          ))}
        </div>
      )
    }

    if (message.content.startsWith("FOOD_PAIRINGS:")) {
      const pairings = message.content.replace("FOOD_PAIRINGS:", "").split("|")

      return (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">{getTranslation(language, "foodPairing")}</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {pairings.map((pairing, index) => (
              <li key={index}>{pairing}</li>
            ))}
          </ul>
        </div>
      )
    }

    return <div className="whitespace-pre-wrap text-sm text-gray-700">{message.content}</div>
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-red-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Wine className="w-5 h-5" />
          <h3 className="font-semibold">{getTranslation(language, "title")}</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear Chat Button */}
          <button
            onClick={clearChat}
            className="hover:bg-red-700 p-1 rounded"
            title={getTranslation(language, "clearChat")}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="text-xs bg-red-700 text-white border border-red-500 rounded px-1 py-0.5"
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
            <option value="nl">NL</option>
          </select>

          <button onClick={onClose} className="hover:bg-red-700 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-900"
              }`}
            >
              {renderMessage(message)}
            </div>
          </div>
        ))}

        {/* Dynamic Suggestion Prompts - Always show exactly 6 */}
        {showSuggestions && messages.length === 1 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 text-center">{getTranslation(language, "suggestionsTitle")}</p>
            <div className="grid grid-cols-1 gap-2">
              {dynamicSuggestions.map((suggestion, index) => (
                <button
                  key={`${language}-${index}-${suggestion}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors text-gray-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={getTranslation(language, "placeholder")}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
