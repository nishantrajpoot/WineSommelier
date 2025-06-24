"use client"

import { useState } from "react"
import type { Wine, Language } from "@/types/wine"
import { getTranslation } from "@/utils/translations"
import { ExternalLink, Euro } from "lucide-react"
import { WinePopup } from "./wine-popup"

interface WineCardProps {
  wine: Wine
  language: Language
}

export function WineCard({ wine, language }: WineCardProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  // Remove this entire function
  // const handleDirectLink = (e: React.MouseEvent) => {
  //   e.stopPropagation()
  //   if (wine.link) {
  //     window.open(wine.link, "_blank", "noopener,noreferrer")
  //   }
  // }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex gap-3">
          <img
            src={wine.image || "/placeholder.svg?height=80&width=64"}
            alt={wine.productName}
            className="w-16 h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
            crossOrigin="anonymous"
            onClick={() => setIsPopupOpen(true)}
          />
          <div className="flex-1 min-w-0">
            <h4
              className="font-medium text-sm text-gray-900 line-clamp-2 mb-2 cursor-pointer hover:text-red-600 transition-colors"
              onClick={() => setIsPopupOpen(true)}
            >
              {wine.productName}
            </h4>

            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Euro className="w-3 h-3" />
                <span className="font-semibold text-green-600">€{wine.price}</span>
                {wine.originalPrice && wine.originalPrice > wine.price && (
                  <span className="line-through text-gray-400">€{wine.originalPrice}</span>
                )}
              </div>

              {wine.volume && (
                <div>
                  {getTranslation(language, "volume")}: {wine.volume}
                </div>
              )}

              {wine.discount && wine.discount !== "null" && wine.discount !== "" && wine.discount !== "0" && (
                <div className="text-red-600 font-medium text-xs">{wine.discount}</div>
              )}
            </div>

            <div className="flex gap-1 mt-2">
              <button
                onClick={() => setIsPopupOpen(true)}
                className="inline-flex items-center gap-1 text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {getTranslation(language, "viewProduct")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <WinePopup wine={wine} language={language} isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
    </>
  )
}
