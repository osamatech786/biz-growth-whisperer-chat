
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VertexAIRequest {
  message: string;
  sessionId?: string;
  operation: 'stream_query' | 'create_session' | 'list_sessions' | 'get_session' | 'delete_session';
}

const getAccessToken = async () => {
  const serviceAccountJson = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON');
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON environment variable is required');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  
  // Create JWT header
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: serviceAccount.private_key_id
  };

  // Create JWT payload
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };

  // Process the private key
  const privateKeyPem = serviceAccount.private_key.replace(/\\n/g, '\n');
  
  // Remove header and footer, and clean up the key
  const privateKeyB64 = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  // Convert base64 to Uint8Array
  const privateKeyDer = Uint8Array.from(atob(privateKeyB64), c => c.charCodeAt(0));

  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Create JWT
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const dataToSign = `${headerB64}.${payloadB64}`;
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(dataToSign)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const jwt = `${dataToSign}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token exchange failed:', errorText);
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, sessionId, operation }: VertexAIRequest = await req.json();
    console.log('Received request:', { operation, sessionId, message: message.substring(0, 100) });

    const accessToken = await getAccessToken();
    const projectId = 'adk-gp';
    const location = 'us-central1';
    const reasoningEngineId = '1740192655234564096';

    const baseUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/reasoningEngines/${reasoningEngineId}`;
    
    let url: string;
    let requestBody: any;

    switch (operation) {
      case 'stream_query':
        url = `${baseUrl}:streamQuery`;
        requestBody = {
          input: {
            text: message
          }
        };
        // Add session if provided
        if (sessionId) {
          requestBody.sessionId = sessionId;
        }
        break;
      
      case 'create_session':
        url = `${baseUrl}:query`;
        requestBody = {
          input: {
            text: "Initialize new conversation session"
          }
        };
        break;
      
      case 'list_sessions':
        // For listing sessions, we'll use a query operation
        url = `${baseUrl}:query`;
        requestBody = {
          input: {
            text: "List available sessions"
          }
        };
        break;
      
      case 'get_session':
        url = `${baseUrl}:query`;
        requestBody = {
          input: {
            text: `Get session information for ${sessionId}`
          }
        };
        if (sessionId) {
          requestBody.sessionId = sessionId;
        }
        break;
      
      case 'delete_session':
        url = `${baseUrl}:query`;
        requestBody = {
          input: {
            text: `Delete session ${sessionId}`
          }
        };
        if (sessionId) {
          requestBody.sessionId = sessionId;
        }
        break;
      
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    console.log('Making request to Vertex AI:', { url, requestBody });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vertex AI API error:', response.status, errorText);
      throw new Error(`Vertex AI API error: ${response.status} ${errorText}`);
    }

    // Handle streaming response for stream_query
    if (operation === 'stream_query') {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body available for streaming');
      }

      const stream = new ReadableStream({
        start(controller) {
          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
              }
              controller.close();
            } catch (error) {
              console.error('Streaming error:', error);
              controller.error(error);
            }
          };
          pump();
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    // Handle regular JSON response
    const data = await response.json();
    console.log('Vertex AI response:', data);

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in vertex-ai-agent function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the function logs for more information'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
