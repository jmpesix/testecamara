import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.AI_MODEL_NAME || 'gemini-2.0-flash';

export function getStreamPrompt(message: string, mode: 'suggest' | 'info'): string {
  if (mode === 'suggest') {
    return `
      Você é a Assistente de Gabinete Legislativo de São João da Barra, RJ.
      O vereador solicitou uma sugestão de resposta para a seguinte conversa/demanda:
      "${message}"

      Diretrizes de São João da Barra:
      - Tom: Institucional, porém atencioso, caloroso e empático.
      - Foco: Informar de forma elegante que a demanda foi recebida e que o gabinete irá analisar e encaminhar ao órgão competente.
      - Conhecimento Local: Considere que o cidadão pode estar falando de localidades como Grussaí, Atafona, Barcelos ou a Sede.
      
      Gere apenas o texto da resposta sugerida para o cidadão. Não inclua introduções, explicações, nem aspas. Retorne apenas o conteúdo direto da mensagem de resposta.
    `;
  } else {
    return `
      Você é a Consultora Legislativa de São João da Barra, RJ.
      O vereador deseja informações ou orientações baseadas nesta demanda do munícipe:
      "${message}"

      Forneça uma análise técnica ou informação relevante para o vereador sobre como ele pode proceder ou o que a legislação municipal geralmente prevê para temas similares em SJB (considerando royalties, infraestrutura, turismo, porto do açu, etc).
      Gere apenas a análise estratégica direta para o vereador. Use formatação limpa e profissional com tópicos se necessário.
    `;
  }
}

export async function* getGeminiStream(message: string, mode: 'suggest' | 'info') {
  if (!API_KEY) {
    yield 'Erro: Chave de API do Gemini não configurada.';
    return;
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const prompt = getStreamPrompt(message, mode);

  try {
    const result = await model.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error('Erro na geração de stream do Gemini:', error);
    yield 'Erro ao gerar resposta com inteligência artificial.';
  }
}
