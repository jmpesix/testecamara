import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.AI_MODEL_NAME || 'gemini-2.0-flash';
const genAI = new GoogleGenerativeAI(API_KEY || '');

export async function analyzeMessage(text: string, mode: 'triage' | 'suggest' | 'info' = 'triage') {
  if (!API_KEY) {
    console.warn('GEMINI_API_KEY missing, using mock analysis');
    return {
      sentiment: 'neutro',
      priority: 'média',
      category: 'Geral',
      summary: 'Demanda recebida via portal',
      suggested_response: 'Olá! Recebemos sua mensagem e entraremos em contato em breve.',
      info: 'Informação não disponível sem chave de API.'
    };
  }
  
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  let prompt = '';
  
  if (mode === 'triage') {
    prompt = `
      Você é a Assistente Virtual Legislativa do Gabinete Parlamentar no Município de São João da Barra, RJ.
      Sua missão é realizar a triagem, análise de sentimento e resumo para as mensagens dos cidadãos.

      Contexto de São João da Barra:
      - Temas: Porto do Açu, Pesca, Turismo, Royalties, Infraestrutura urbana, Saúde e Educação.

      Analise a seguinte mensagem: "${text}"
      
      Retorne estritamente um JSON:
      {
        "sentiment": "positivo" | "neutro" | "negativo",
        "priority": "baixa" | "média" | "alta" | "urgente",
        "category": "Saúde" | "Infraestrutura" | "Educação" | "Segurança" | "Pesca/Mar" | "Porto do Açu" | "Outros",
        "summary": "resumo de até 10 palavras"
      }
    `;
  } else if (mode === 'suggest') {
    prompt = `
      Você é a Assistente de Gabinete Legislativo de São João da Barra, RJ.
      O vereador solicitou uma sugestão de resposta para a seguinte conversa/demanda:
      "${text}"

      Diretrizes de São João da Barra:
      - Tom: Institucional, porém atencioso e empático.
      - Foco: Informar que a demanda foi recebida e será encaminhada/analisada.
      - Conhecimento Local: Considere que o cidadão pode estar falando de localidades como Grussaí, Atafona, Barcelos ou a Sede.

      Gere uma sugestão de resposta curta e oficial para o cidadão.
      Retorne estritamente um JSON:
      {
        "suggested_response": "texto da resposta"
      }
    `;
  } else if (mode === 'info') {
    prompt = `
      Você é a Consultora Legislativa de São João da Barra, RJ.
      O vereador deseja informações ou orientações baseadas nesta demanda do munícipe:
      "${text}"

      Forneça uma análise técnica ou informação relevante para o vereador sobre como ele pode proceder ou o que a legislação municipal geralmente prevê para temas similares em SJB.
      Retorne estritamente um JSON:
      {
        "info": "análise técnica ou informação estratégica para o vereador"
      }
    `;
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanedText = response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Erro na IA:', error);
    return { error: 'Erro no processamento da IA' };
  }
}
