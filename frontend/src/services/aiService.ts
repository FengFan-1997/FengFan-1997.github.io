const API_URL = '/api/generate';

export interface AIResponse {
  text: string;
  error?: string;
}

export const generateContent = async (prompt: string): Promise<AIResponse> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { text: '', error: errorData.error || `API Error: ${response.status}` };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { text };
  } catch (error: any) {
    return { text: '', error: error.message || 'Unknown error occurred' };
  }
};
