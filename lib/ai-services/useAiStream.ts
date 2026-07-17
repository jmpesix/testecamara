import { useState, useCallback } from 'react';

export interface UseAiStreamOptions {
  onChunk?: (chunk: string) => void;
  onFinish?: (fullText: string) => void;
  onError?: (error: any) => void;
}

export function useAiStream() {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const streamAnalyze = useCallback(async (
    message: string, 
    mode: 'suggest' | 'info',
    options?: UseAiStreamOptions
  ) => {
    setLoading(true);
    setContent('');
    let accumulatedText = '';
    
    try {
      const response = await fetch('/api/analyze-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, mode })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream não suportado pelo navegador ou ambiente.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Mantém a linha potencialmente incompleta no buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                accumulatedText += parsed.text;
                setContent(accumulatedText);
                if (options?.onChunk) {
                  options.onChunk(parsed.text);
                }
              }
            } catch (e) {
              console.error('Erro ao analisar JSON do stream:', e);
            }
          }
        }
      }

      if (options?.onFinish) {
        options.onFinish(accumulatedText);
      }
      return accumulatedText;
    } catch (err: any) {
      console.error('Erro durante streaming da IA:', err);
      if (options?.onError) {
        options.onError(err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    streamAnalyze,
    loading,
    content,
    setContent
  };
}
