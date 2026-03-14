import type { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export function setupRealtimeAI(httpServer: HTTPServer) {
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/api/realtime-voice' 
  });

  wss.on('connection', async (clientWs: WebSocket, req) => {
    console.log('[Realtime AI] Client connected from:', req.socket.remoteAddress);

    // Parse voice preference from query string (default to 'alloy')
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const voice = (url.searchParams.get('voice') as any) || 'alloy';
    const instructions = url.searchParams.get('instructions') || 
      `You are Sparky, an expert AI assistant for electrical contractors. You help with TDLR compliance, NEC 2023 code questions, business operations, and client management. Be professional, friendly, and concise. You have access to the user's business data and can help create invoices, schedule jobs, and manage clients.`;

    let openaiWs: WebSocket | null = null;

    try {
      // Connect to OpenAI Realtime API
      openaiWs = new WebSocket(
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01',
        {
          headers: {
            'Authorization': `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY}`,
            'OpenAI-Beta': 'realtime=v1'
          }
        }
      );

      openaiWs.on('open', () => {
        console.log('[Realtime AI] Connected to OpenAI Realtime API');

        // Configure session with Sparky's personality and voice
        const sessionUpdate = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: instructions,
            voice: voice,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            tools: [
              {
                type: 'function',
                name: 'create_invoice',
                description: 'Create a new invoice for a client',
                parameters: {
                  type: 'object',
                  properties: {
                    client_name: { type: 'string', description: 'Client name' },
                    amount: { type: 'number', description: 'Invoice amount' },
                    description: { type: 'string', description: 'Service description' }
                  },
                  required: ['client_name', 'amount', 'description']
                }
              },
              {
                type: 'function',
                name: 'schedule_job',
                description: 'Schedule a new job or appointment',
                parameters: {
                  type: 'object',
                  properties: {
                    client_name: { type: 'string', description: 'Client name' },
                    date: { type: 'string', description: 'Job date (YYYY-MM-DD)' },
                    time: { type: 'string', description: 'Job time (HH:MM)' },
                    service_type: { type: 'string', description: 'Type of service' }
                  },
                  required: ['client_name', 'date', 'time', 'service_type']
                }
              },
              {
                type: 'function',
                name: 'get_nec_code',
                description: 'Look up NEC 2023 electrical code information',
                parameters: {
                  type: 'object',
                  properties: {
                    code_section: { type: 'string', description: 'NEC code section number' },
                    topic: { type: 'string', description: 'Code topic or question' }
                  },
                  required: ['topic']
                }
              }
            ],
            temperature: 0.8,
            max_response_output_tokens: 4096
          }
        };

        openaiWs?.send(JSON.stringify(sessionUpdate));
        console.log(`[Realtime AI] Session configured with voice: ${voice}`);
      });

      // Forward messages: Client → OpenAI
      clientWs.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Handle different message types
          if (data.type === 'input_audio_buffer.append') {
            // Forward audio directly
            openaiWs?.send(JSON.stringify(data));
          } else if (data.type === 'input_audio_buffer.commit') {
            openaiWs?.send(JSON.stringify(data));
          } else if (data.type === 'response.create') {
            openaiWs?.send(JSON.stringify(data));
          } else if (data.type === 'conversation.item.create') {
            openaiWs?.send(JSON.stringify(data));
          } else if (data.type === 'response.cancel') {
            openaiWs?.send(JSON.stringify(data));
          } else {
            // Forward other control messages
            openaiWs?.send(JSON.stringify(data));
          }
        } catch (error) {
          console.error('[Realtime AI] Error parsing client message:', error);
        }
      });

      // Forward messages: OpenAI → Client
      openaiWs.on('message', (message: Buffer) => {
        try {
          const event = JSON.parse(message.toString());
          
          // Log important events
          if (event.type === 'error') {
            console.error('[Realtime AI] OpenAI error:', event.error);
          } else if (event.type === 'response.audio_transcript.done') {
            console.log('[Realtime AI] Sparky said:', event.transcript);
          } else if (event.type === 'conversation.item.input_audio_transcription.completed') {
            console.log('[Realtime AI] User said:', event.transcript);
          } else if (event.type === 'response.function_call_arguments.done') {
            console.log('[Realtime AI] Function called:', event.name, event.arguments);
            
            // Handle function calls
            handleFunctionCall(event, clientWs, openaiWs);
            return; // Don't forward to client yet
          }
          
          // Forward event to client
          clientWs.send(JSON.stringify(event));
        } catch (error) {
          console.error('[Realtime AI] Error processing OpenAI message:', error);
        }
      });

      openaiWs.on('error', (error) => {
        console.error('[Realtime AI] OpenAI WebSocket error:', error);
        clientWs.send(JSON.stringify({ 
          type: 'error', 
          error: { message: 'Connection error with AI service' } 
        }));
      });

      openaiWs.on('close', () => {
        console.log('[Realtime AI] OpenAI connection closed');
        clientWs.close();
      });

    } catch (error) {
      console.error('[Realtime AI] Error connecting to OpenAI:', error);
      clientWs.send(JSON.stringify({ 
        type: 'error', 
        error: { message: 'Failed to connect to AI service' } 
      }));
      clientWs.close();
    }

    clientWs.on('error', (error) => {
      console.error('[Realtime AI] Client WebSocket error:', error);
    });

    clientWs.on('close', () => {
      console.log('[Realtime AI] Client disconnected');
      openaiWs?.close();
    });
  });

  console.log('[Realtime AI] WebSocket server initialized on /api/realtime-voice');
}

// Handle function calls from OpenAI
async function handleFunctionCall(event: any, clientWs: WebSocket, openaiWs: WebSocket | null) {
  const functionName = event.name;
  const args = JSON.parse(event.arguments);
  const callId = event.call_id;

  let result: any = {};

  try {
    switch (functionName) {
      case 'create_invoice':
        result = {
          success: true,
          message: `Invoice created for ${args.client_name} for $${args.amount}. ${args.description}`,
          invoice_id: 'INV-' + Date.now()
        };
        break;

      case 'schedule_job':
        result = {
          success: true,
          message: `Job scheduled for ${args.client_name} on ${args.date} at ${args.time}. Service: ${args.service_type}`,
          job_id: 'JOB-' + Date.now()
        };
        break;

      case 'get_nec_code':
        result = {
          success: true,
          info: `NEC 2023 code information for ${args.topic}. [This would query a code database in production]`
        };
        break;

      default:
        result = { error: 'Unknown function' };
    }

    // Send function result back to OpenAI
    const functionOutput = {
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: JSON.stringify(result)
      }
    };

    openaiWs?.send(JSON.stringify(functionOutput));

    // Request response
    openaiWs?.send(JSON.stringify({ type: 'response.create' }));

  } catch (error) {
    console.error('[Realtime AI] Function call error:', error);
    
    const functionOutput = {
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: JSON.stringify({ error: 'Function execution failed' })
      }
    };

    openaiWs?.send(JSON.stringify(functionOutput));
  }
}
