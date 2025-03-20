import OpenAI from 'openai'

export const model = import.meta.env.VITE_OPENAI_MODEL
export const openai = new OpenAI({
  baseURL: import.meta.env.VITE_OPENAI_API_BASE_URL,
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})
