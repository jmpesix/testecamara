import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY || '');

export async function analyzeMessage(text: string) {
  if (!API_KEY) {
    console.warn('GEMINI_API_KEY missing, using mock analysis');
    return {
      sentiment: 'neutro',
      priority: 'média',
      category: 'Geral',
      summary: 'Demanda recebida via portal',
      suggested_response: 'Olá! Recebemos sua mensagem e entraremos em contato em breve.'
    };
  }
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const prompt = `
    Analise a seguinte mensagem de um cidadão para um vereador:
    "${text}"
    
    Extraia as seguintes informações no formato JSON:
    {
      "sentiment": "positivo" | "neutro" | "negativo",
      "priority": "baixa" | "média" | "alta" | "urgente",
      "category": "Saúde" | "Infraestrutura" | "Educação" | "Segurança" | "Outros",
      "summary": "um resumo curtíssimo (máximo 10 palavras) da demanda",
      "suggested_response": "uma resposta profissional, empática e curta"
    }
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const cleanedText = response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(cleanedText);
}
