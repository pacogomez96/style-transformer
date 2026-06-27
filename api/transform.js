export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, apiKey } = req.body;

  if (!text || !apiKey) {
    return res.status(400).json({ error: 'Missing text or apiKey' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: `You are an expert at transforming dense, academic writing into the engaging, conversational style of Mark Manson. 

Mark Manson's style includes:
- Casual, conversational tone (like talking to a friend)
- Strategic use of profanity and humor to make points stick
- Direct, no-BS approach to complex topics
- Short, punchy sentences mixed with thoughtful longer ones
- Relatable examples and personal touches
- Self-deprecating humor and honesty
- Breaking down complex ideas into digestible pieces
- Questioning assumptions and conventional wisdom
- Making readers feel understood and heard

Your job: Take the academic text and rewrite it in Mark Manson's voice. Keep the core ideas and meaning intact, but make it readable, memorable, and actually enjoyable.`,
        messages: [
          {
            role: 'user',
            content: `Transform this academic text into Mark Manson's style:\n\n${text}`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error?.message || 'API error' });
    }

    const data = await response.json();
    return res.status(200).json({ text: data.content[0].text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
