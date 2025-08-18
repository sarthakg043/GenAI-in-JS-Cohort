import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const { message, apiKey, service } = await request.json();

    if (!message || !apiKey || !service) {
      return new Response('Missing required fields: message, apiKey, or service', { status: 400 });
    }

    let openai: OpenAI;
    let model: string;

    if (service === 'openai') {
      openai = new OpenAI({
        apiKey: apiKey,
      });
      model = 'gpt-3.5-turbo';

    } else if (service === 'gemini') {
      openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      });
      model = 'gemini-2.5-pro';

    } else {
      return new Response('Invalid service. Must be "openai" or "gemini"', { status: 400 });
    }

    const stream = await openai.chat.completions.create({
      model: model,
      stream: true,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that solves problems and provides detailed explanations.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
            const content = chunk.choices[0].delta.content || '';
            if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
        }
        controller.close();
      }
    });

    return new Response(readable,{
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    });

  } catch (error) {
    console.error('Error in chat completion:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}