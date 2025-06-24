import type { Wine } from "@/types/wine"

export interface CartItem {
  wine: Wine
  quantity: number
  addedAt: Date
}

const CART_STORAGE_KEY = "delhaize-cart-items"
const MAX_CART_ITEMS = 20

export class DelhaizeCart {
  private items: CartItem[] = []

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        this.items = JSON.parse(stored).map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt),
        }))
      }
    } catch (error) {
      console.error("Error loading cart from storage:", error)
      this.items = []
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items))
    } catch (error) {
      console.error("Error saving cart to storage:", error)
    }
  }

  addItem(wine: Wine, quantity = 1): boolean {
    // Check if item already exists
    const existingIndex = this.items.findIndex((item) => item.wine._id === wine._id)

    if (existingIndex >= 0) {
      // Update quantity of existing item
      this.items[existingIndex].quantity += quantity
      this.items[existingIndex].addedAt = new Date()
    } else {
      // Add new item
      if (this.items.length >= MAX_CART_ITEMS) {
        return false // Cart is full
      }

      this.items.push({
        wine,
        quantity,
        addedAt: new Date(),
      })
    }

    this.saveToStorage()
    return true
  }

  removeItem(wineId: string): void {
    this.items = this.items.filter((item) => item.wine._id !== wineId)
    this.saveToStorage()
  }

  updateQuantity(wineId: string, quantity: number): void {
    const index = this.items.findIndex((item) => item.wine._id === wineId)
    if (index >= 0) {
      if (quantity <= 0) {
        this.removeItem(wineId)
      } else {
        this.items[index].quantity = quantity
        this.saveToStorage()
      }
    }
  }

  getItems(): CartItem[] {
    return [...this.items]
  }

  getItemCount(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0)
  }

  getTotalPrice(): number {
    return this.items.reduce((total, item) => total + item.wine.price * item.quantity, 0)
  }

  isInCart(wineId: string): boolean {
    return this.items.some((item) => item.wine._id === wineId)
  }

  getItemQuantity(wineId: string): number {
    const item = this.items.find((item) => item.wine._id === wineId)
    return item ? item.quantity : 0
  }

  clearCart(): void {
    this.items = []
    this.saveToStorage()
  }

  // Generate URL with cart items as query parameters for Delhaize
  generateDelhaizeCartUrl(): string {
    if (this.items.length === 0) {
      return "https://www.delhaize.be/fr/shop"
    }

    // Create a simplified cart data structure
    const cartData = this.items.map((item) => ({
      id: item.wine._id,
      name: item.wine.productName,
      price: item.wine.price,
      quantity: item.quantity,
      url: item.wine.link,
    }))

    // Encode cart data as base64 for URL
    const encodedCart = btoa(JSON.stringify(cartData))

    // Return Delhaize URL with cart data (this would need to be implemented by Delhaize)
    // For now, we'll use a custom parameter that could be processed by a browser extension or script
    return `https://www.delhaize.be/fr/shop?sommelier_cart=${encodedCart}`
  }

  // Export cart data for external processing
  exportCartData(): string {
    return JSON.stringify(this.items, null, 2)
  }

  // Import cart data
  importCartData(data: string): boolean {
    try {
      const imported = JSON.parse(data)
      this.items = imported.map((item: any) => ({
        ...item,
        addedAt: new Date(item.addedAt),
      }))
      this.saveToStorage()
      return true
    } catch (error) {
      console.error("Error importing cart data:", error)
      return false
    }
  }
}

// Export singleton instance
export const delhaizeCart = new DelhaizeCart()
