export interface Wine {
  _id: string
  productName: string
  image: string
  price: number
  priceCurrency: string
  originalPrice: number
  volume: string
  pricePerLiter: string
  discount: string
  link: string
}

export interface WineData {
  workflowId: string
  runId: string
  executedAt: string
  data: Wine[]
  totalCount: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export type Language = "en" | "fr" | "nl"
export type WineColor = "red" | "white" | "rose" | "sparkling"
export type PriceRange = "budget" | "mid" | "premium" | "luxury"
