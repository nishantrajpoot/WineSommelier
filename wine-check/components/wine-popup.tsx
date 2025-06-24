"use client"
import { useState } from "react"
import { X, ExternalLink, Euro, ShoppingCart, Plus, Check } from "lucide-react"
import type { Wine, Language } from "@/types/wine"
import { getTranslation } from "@/utils/translations"
import { delhaizeCart } from "@/utils/delhaize-cart"

interface WinePopupProps {
  wine: Wine
  language: Language
  isOpen: boolean
  onClose: () => void
}

export function WinePopup({ wine, language, isOpen, onClose }: WinePopupProps) {
  const [isAddedToCart, setIsAddedToCart] = useState(delhaizeCart.isInCart(wine._id))
  const [quantity, setQuantity] = useState(delhaizeCart.getItemQuantity(wine._id) || 1)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleAddToCart = () => {
    const success = delhaizeCart.addItem(wine, quantity)
    if (success) {
      setIsAddedToCart(true)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity)
      if (isAddedToCart) {
        delhaizeCart.updateQuantity(wine._id, newQuantity)
      }
    }
  }

  const handleRemoveFromCart = () => {
    delhaizeCart.removeItem(wine._id)
    setIsAddedToCart(false)
    setQuantity(1)
  }

  const handleGoToWinePage = () => {
    // Open the specific wine page on Delhaize
    if (wine.link) {
      window.open(wine.link, "_blank", "noopener,noreferrer")
    } else {
      // Fallback to general Delhaize wine section
      window.open("https://www.delhaize.be/fr/shop/Vins-and-bulles", "_blank", "noopener,noreferrer")
    }
  }

  const handleGoToDelhaizeWithCart = () => {
    // Open Delhaize with cart data
    const cartUrl = delhaizeCart.generateDelhaizeCartUrl()
    window.open(cartUrl, "_blank", "noopener,noreferrer")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-red-600 text-white rounded-t-lg">
          <h3 className="font-semibold text-sm">{getTranslation(language, "wineDetails")}</h3>
          <button onClick={onClose} className="hover:bg-red-700 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Wine Image */}
          <div className="flex justify-center mb-4">
            <img
              src={wine.image || "/placeholder.svg?height=160&width=128"}
              alt={wine.productName}
              className="w-32 h-40 object-cover rounded-lg shadow-sm"
              crossOrigin="anonymous"
            />
          </div>

          {/* Wine Name */}
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">{wine.productName}</h2>

          {/* Wine Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{getTranslation(language, "price")}:</span>
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-green-600" />
                <span className="font-bold text-green-600 text-lg">€{wine.price.toFixed(2)}</span>
                {wine.originalPrice && wine.originalPrice > wine.price && (
                  <span className="line-through text-gray-400">€{wine.originalPrice.toFixed(2)}</span>
                )}
              </div>
            </div>

            {wine.volume && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{getTranslation(language, "volume")}:</span>
                <span className="font-medium">{wine.volume}</span>
              </div>
            )}

            {wine.pricePerLiter && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Price per liter:</span>
                <span className="font-medium">{wine.pricePerLiter}</span>
              </div>
            )}

            {wine.discount && wine.discount !== "null" && wine.discount !== "" && wine.discount !== "0" && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{getTranslation(language, "discount")}:</span>
                <span className="font-bold text-red-600">{wine.discount}</span>
              </div>
            )}

            {/* Show wine URL for debugging */}
            {wine.link && (
              <div className="text-xs text-gray-500 break-all">
                <strong>Delhaize URL:</strong> {wine.link}
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700 font-medium">{getTranslation(language, "quantity")}:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                -
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= 10}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-700 text-sm">{getTranslation(language, "addedToCart")}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isAddedToCart ? (
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                {getTranslation(language, "addToCart")}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="w-full flex items-center justify-center gap-2 bg-green-100 text-green-700 px-4 py-3 rounded-lg border border-green-300">
                  <Check className="w-4 h-4" />
                  {getTranslation(language, "inCart")} ({delhaizeCart.getItemQuantity(wine._id)})
                </div>
                <button
                  onClick={handleRemoveFromCart}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  {getTranslation(language, "removeFromCart")}
                </button>
              </div>
            )}

            {/* Direct wine page button */}
            <button
              onClick={handleGoToWinePage}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              {getTranslation(language, "viewOnDelhaize")}
            </button>

            {/* Cart-based shopping button */}
            {delhaizeCart.getItemCount() > 0 && (
              <button
                onClick={handleGoToDelhaizeWithCart}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                {getTranslation(language, "shopWithCart")} ({delhaizeCart.getItemCount()})
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {getTranslation(language, "close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
