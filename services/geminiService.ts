
export const polishReportObservations = async (context: string) => {
  try {
    const r = await fetch('/api/polish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('Polish API error:', data);
      return context;
    }

    return typeof data.text === 'string' && data.text.trim() ? data.text : context;
  } catch (error) {
    console.error('Polish API error:', error);
    return context;
  }
};
