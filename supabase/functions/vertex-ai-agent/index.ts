
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
    throw new Error('Service account JSON not found');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  
  // Create JWT for Google Cloud authentication
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: serviceAccount.private_key_id
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };

  // Import the private key - fix the key format
  const privateKeyPem = serviceAccount.private_key
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n')
    .replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----');

  const privateKeyDer = Uint8Array.from(
    atob(privateKeyPem.replace(/-----BEGIN PRIVATE KEY-----\n/, '').replace(/\n-----END PRIVATE KEY-----/, '').replace(/\n/g, '')),
    c => c.charCodeAt(0)
  );

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

  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    console.error('Token exchange failed:', tokenData);
    throw new Error(`Token exchange failed: ${tokenData.error}`);
  }

  return tokenData.access_token;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, sessionId, operation }: VertexAIRequest = await req.json();
    const accessToken = await getAccessToken();

    const baseUrl = 'https://us-central1-aiplatform.googleapis.com/v1/projects/adk-gp/locations/us-central1/reasoningEngines/1740192655234564096';
    
    let url: string;
    let requestBody: any;

    switch (operation) {
      case 'stream_query':
        url = `${baseUrl}:streamQuery`;
        requestBody = {
          input: {
            text: message
          },
          ...(sessionId && { session: sessionId })
        };
        break;
      
      case 'create_session':
        url = `${baseUrl}:query`;
        requestBody = {
          input: {
            text: "Create new session"
          }
        };
        break;
      
      case 'list_sessions':
        url = `${baseUrl}:query`;
        requestBody = {
          input: {
            text: "List sessions"
          }
        };
        break;
      
      case 'get_session':
        url = `${baseUrl}:query`;
        requestBody = {
          input: {
            text: `Get session ${sessionId}`
          },
          session: sessionId
        };
        break;
      
      case 'delete_session':
        url = `${baseUrl}:query`;
        requestBody = {
          input: {
            text: `Delete session ${sessionId}`
          },
          session: sessionId
        };
        break;
      
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    console.log('Making request to Vertex AI:', { url, operation, sessionId });

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
      console.error('Vertex AI API error:', errorText);
      throw new Error(`Vertex AI API error: ${response.status} ${errorText}`);
    }

    // For streaming responses
    if (operation === 'stream_query') {
      const reader = response.body?.getReader();
      const stream = new ReadableStream({
        start(controller) {
          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader!.read();
                if (done) break;
                controller.enqueue(value);
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          };
          pump();
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    // For non-streaming responses
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
