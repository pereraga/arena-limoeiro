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

    // Buscar ou Criar Cliente na tabela 'customers' com suporte a documento e observações
    async getOrCreateCustomer(name, phone, email = '', extraData = {}) {
      const client = this.getClient();
      if (!client) return { id: 'cust-local-' + Date.now(), name, phone, email, ...extraData };

      try {
        const cleanPhone = (phone || '').replace(/\D/g, '');
        // Tenta encontrar por telefone (formatado ou apenas dígitos)
        let existing = null;
        if (phone) {
          const { data: byPhone } = await client
            .from('customers')
            .select('*')
            .or(`phone.eq.${phone},phone.eq.${cleanPhone}`)
            .limit(1);
          if (byPhone && byPhone.length > 0) existing = byPhone[0];
        }

        const notesArr = [];
        if (extraData.birth_date) notesArr.push(`Nascimento: ${extraData.birth_date}`);
        if (extraData.emergency_contact) notesArr.push(`Emergência: ${extraData.emergency_contact}`);
        if (extraData.health_notes) notesArr.push(`Saúde: ${extraData.health_notes}`);
        const notesStr = notesArr.join(' | ') || null;

        if (existing) {
          const updates = {};
          if (name && name !== existing.name) updates.name = name;
          if (email && email !== existing.email) updates.email = email;
          if (extraData.cpf && extraData.cpf !== existing.document) updates.document = extraData.cpf;
          if (notesStr && notesStr !== existing.notes) updates.notes = notesStr;

          if (Object.keys(updates).length > 0) {
            try {
              await client.from('customers').update(updates).eq('id', existing.id);
            } catch(e) {}
          }
          return { ...existing, ...updates, ...extraData };
        }

        const newId = 'cust-' + Date.now();
        const payload = {
          id: newId,
          name: name || 'Cliente',
          phone: phone || '',
          email: email || '',
          document: extraData.cpf || null,
          notes: notesStr
        };

        const { data: created, error } = await client
          .from('customers')
          .insert([payload])
          .select()
          .single();

        if (!error && created) {
          return created;
        }

        // Fallback garantido: apenas campos base essenciais
        const { data: fallbackCreated } = await client
          .from('customers')
          .insert([{ id: newId, name: name || 'Cliente', phone: phone || '', email: email || '' }])
          .select()
          .single();

        return fallbackCreated || { id: newId, name, phone, email, document: extraData.cpf, ...extraData };
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
