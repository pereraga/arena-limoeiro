export default async function handler(req, res) {
  // Configuração segura a partir de variáveis de ambiente
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.URL_SUPABASE;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorPayload = {
      success: false,
      status: 'unconfigured',
      message: 'Supabase environment variables not configured.'
    };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(errorPayload);
    }
    return new Response(JSON.stringify(errorPayload), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const cleanUrl = supabaseUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    const targetEndpoint = `${cleanUrl}/rest/v1/courts?select=id&limit=1`;

    const response = await fetch(targetEndpoint, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey.trim(),
        'Authorization': `Bearer ${supabaseAnonKey.trim()}`,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (response.ok) {
      // Consome o corpo da resposta sem repassar nenhum dado
      await response.text();

      const successPayload = {
        success: true,
        status: 'active',
        timestamp: new Date().toISOString()
      };

      if (res && typeof res.status === 'function') {
        return res.status(200).json(successPayload);
      }
      return new Response(JSON.stringify(successPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const failurePayload = {
      success: false,
      status: 'error',
      statusCode: response.status,
      timestamp: new Date().toISOString()
    };

    if (res && typeof res.status === 'function') {
      return res.status(502).json(failurePayload);
    }
    return new Response(JSON.stringify(failurePayload), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    const errorPayload = {
      success: false,
      status: 'exception',
      timestamp: new Date().toISOString()
    };

    if (res && typeof res.status === 'function') {
      return res.status(500).json(errorPayload);
    }
    return new Response(JSON.stringify(errorPayload), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
