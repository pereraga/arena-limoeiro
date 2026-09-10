// Cliente de Conexão com o Supabase da Arena Limoeiro
(function() {
  const STORAGE_KEY = 'arena_supabase_config';
  
  // Tenta carregar do localStorage ou de window.ENV
  function getConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    
    return {
      url: window.SUPABASE_URL || 'https://brmclyukjfijommbxhks.supabase.co',
      anonKey: window.SUPABASE_ANON_KEY || 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7',
      connected: true
    };
  }

  let clientInstance = null;

  function initClient() {
    const config = getConfig();
    if (config.url && config.anonKey && window.supabase && window.supabase.createClient) {
      try {
        const cleanUrl = config.url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
        clientInstance = window.supabase.createClient(cleanUrl, config.anonKey, {
          auth: { persistSession: true },
          realtime: { params: { eventsPerSecond: 10 } }
        });
        return clientInstance;
      } catch (err) {
        console.warn('Erro ao inicializar Supabase:', err);
      }
    }
    return null;
  }

  window.ArenaSupabase = {
    getConfig,
    saveConfig(url, anonKey) {
      const cleanUrl = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
      const trimmedKey = anonKey.trim();
      const cfg = { url: cleanUrl, anonKey: trimmedKey, connected: false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      initClient();
      return this.testConnection();
    },
    disconnect() {
      localStorage.removeItem(STORAGE_KEY);
      clientInstance = null;
    },
    getClient() {
      if (!clientInstance) initClient();
      return clientInstance;
    },
    isReady() {
      return !!this.getClient();
    },
    async testConnection() {
      const client = this.getClient();
      if (!client) return { success: false, message: 'URL ou Chave do Supabase não configuradas.' };

      try {
        const { data, error } = await client.from('courts').select('id').limit(1);
        if (error) {
          return { success: false, message: error.message };
        }
        
        // Marca como conectado
        const current = getConfig();
        current.connected = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));

        return { success: true, message: 'Conectado com sucesso ao Supabase!' };
      } catch (err) {
        return { success: false, message: err.message || 'Erro de conexão de rede.' };
      }
    },

    // Buscar ou Criar Cliente na tabela 'customers' com suporte a ficha completa
    async getOrCreateCustomer(name, phone, email = '', extraData = {}) {
      const client = this.getClient();
      if (!client) return { id: 'cust-local-' + Date.now(), name, phone, email, ...extraData };

      try {
        // Tenta encontrar por telefone
        const { data: existing } = await client
          .from('customers')
          .select('*')
          .eq('phone', phone)
          .maybeSingle();

        if (existing) {
          if (name && name !== existing.name) {
            try {
              await client.from('customers').update({ name, email: email || existing.email }).eq('id', existing.id);
            } catch(e) {}
          }
          return { ...existing, ...extraData };
        }

        const newId = 'cust-' + Date.now();
        const payload = { id: newId, name, phone, email };
        if (extraData.cpf) payload.cpf = extraData.cpf;
        if (extraData.birth_date) payload.birth_date = extraData.birth_date;
        if (extraData.emergency_contact) payload.emergency_contact = extraData.emergency_contact;
        if (extraData.health_notes) payload.health_notes = extraData.health_notes;

        let created = null;
        try {
          const { data, error } = await client
            .from('customers')
            .insert([payload])
            .select()
            .single();
          if (!error) created = data;
        } catch(colErr) {
          const { data, error } = await client
            .from('customers')
            .insert([{ id: newId, name, phone, email }])
            .select()
            .single();
          if (!error) created = data;
        }

        return created || { id: newId, name, phone, email, ...extraData };
      } catch (err) {
        console.error('Erro no cadastro do cliente:', err);
        return { id: 'cust-' + Date.now(), name, phone, email, ...extraData };
      }
    },

    // Canal de Transmissão Ultrarrápida em Tempo Real (Broadcast WebSocket)
    getBroadcastChannel() {
      const client = this.getClient();
      if (!client) return null;
      if (!this._broadcastChannel) {
        this._broadcastChannel = client.channel('arena_realtime_broadcast', {
          config: { broadcast: { self: false } }
        });
        this._broadcastChannel.subscribe();
      }
      return this._broadcastChannel;
    },

    broadcastBooking(booking) {
      try {
        const chan = this.getBroadcastChannel();
        if (chan) {
          chan.send({
            type: 'broadcast',
            event: 'new_booking',
            payload: booking
          });
        }
      } catch (err) {
        console.warn('Erro ao transmitir broadcast de agendamento:', err);
      }
    },

    broadcastCourtUpdate(court) {
      try {
        const chan = this.getBroadcastChannel();
        if (chan) {
          chan.send({
            type: 'broadcast',
            event: 'court_updated',
            payload: court
          });
        }
      } catch (err) {
        console.warn('Erro ao transmitir broadcast de quadra:', err);
      }
    }
  };

  // Inicializa na carga
  initClient();
})();
