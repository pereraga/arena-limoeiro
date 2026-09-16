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

    // Utilitário para extrair dados estruturados das observações do cliente
    parseCustomerNotes(notes) {
      const result = { emergency_contact: '', health_notes: '', birth_date: '', cpf: '' };
      if (!notes) return result;
      if (typeof notes === 'object') {
        return {
          emergency_contact: notes.emergency_contact || notes.emergencyContact || '',
          health_notes: notes.health_notes || notes.healthNotes || '',
          birth_date: notes.birth_date || notes.birthDate || '',
          cpf: notes.cpf || ''
        };
      }
      const trimmed = String(notes).trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const obj = JSON.parse(trimmed);
          return {
            emergency_contact: obj.emergency_contact || obj.emergencyContact || '',
            health_notes: obj.health_notes || obj.healthNotes || '',
            birth_date: obj.birth_date || obj.birthDate || '',
            cpf: obj.cpf || ''
          };
        } catch(e) {}
      }
      const parts = trimmed.split(/\s*\|\s*/);
      for (const part of parts) {
        if (/^emerg[êe]ncia:\s*/i.test(part)) {
          result.emergency_contact = part.replace(/^emerg[êe]ncia:\s*/i, '').trim();
        } else if (/^sa[úu]de:\s*/i.test(part)) {
          result.health_notes = part.replace(/^sa[úu]de:\s*/i, '').trim();
        } else if (/^nascimento:\s*/i.test(part)) {
          result.birth_date = part.replace(/^nascimento:\s*/i, '').trim();
        } else if (/^cpf:\s*/i.test(part)) {
          result.cpf = part.replace(/^cpf:\s*/i, '').trim();
        }
      }
      if (!result.emergency_contact) {
        const m = trimmed.match(/emerg[êe]ncia:\s*([^|\n]+)/i);
        if (m) result.emergency_contact = m[1].trim();
      }
      if (!result.health_notes) {
        const m = trimmed.match(/sa[úu]de:\s*([^|\n]+)/i);
        if (m) result.health_notes = m[1].trim();
      }
      if (!result.birth_date) {
        const m = trimmed.match(/nascimento:\s*([^|\n]+)/i);
        if (m) result.birth_date = m[1].trim();
      }
      if (!result.cpf) {
        const m = trimmed.match(/cpf:\s*([^|\n]+)/i);
        if (m) result.cpf = m[1].trim();
      }
      return result;
    },

    // Buscar ou Criar Cliente na tabela 'customers' com suporte a documento e observações
    async getOrCreateCustomer(name, phone, email = '', extraData = {}) {
      const client = this.getClient();
      if (!client) return { id: 'cust-local-' + Date.now(), name, phone, email, ...extraData };

      try {
        const cleanPhone = (phone || '').replace(/\D/g, '');
        let existing = null;

        // 1. Tenta encontrar por telefone sem quebrar a sintaxe do PostgREST
        if (phone) {
          const { data: d1 } = await client.from('customers').select('*').eq('phone', phone).limit(1);
          if (d1 && d1.length > 0) existing = d1[0];
        }
        if (!existing && cleanPhone) {
          const { data: d2 } = await client.from('customers').select('*').eq('phone', cleanPhone).limit(1);
          if (d2 && d2.length > 0) existing = d2[0];
        }
        if (!existing && cleanPhone.length >= 8) {
          const { data: d3 } = await client.from('customers').select('*').ilike('phone', `%${cleanPhone.slice(-8)}%`).limit(1);
          if (d3 && d3.length > 0) existing = d3[0];
        }

        // 2. Tenta encontrar por CPF (documento) caso fornecido
        const cleanCpf = (extraData.cpf || '').replace(/\D/g, '');
        if (!existing && cleanCpf.length === 11) {
          const { data: byDoc } = await client.from('customers').select('*').eq('document', extraData.cpf).limit(1);
          if (byDoc && byDoc.length > 0) existing = byDoc[0];
          else {
            const { data: byDocClean } = await client.from('customers').select('*').eq('document', cleanCpf).limit(1);
            if (byDocClean && byDocClean.length > 0) existing = byDocClean[0];
          }
        }

        const existingParsed = existing ? this.parseCustomerNotes(existing.notes) : {};
        const mergedCpf = extraData.cpf || (existing ? (existing.document || existing.cpf || existingParsed.cpf) : '') || '';
        const mergedBirth = extraData.birth_date || (existing ? (existing.birth_date || existingParsed.birth_date) : '') || '';
        const mergedEmergency = extraData.emergency_contact || (existing ? (existing.emergency_contact || existingParsed.emergency_contact) : '') || '';
        const mergedHealth = (extraData.health_notes && extraData.health_notes !== 'Nenhuma restrição informada')
          ? extraData.health_notes
          : (existing ? (existing.health_notes || existingParsed.health_notes || extraData.health_notes || '') : (extraData.health_notes || ''));

        const notesArr = [];
        if (mergedBirth) notesArr.push(`Nascimento: ${mergedBirth}`);
        if (mergedEmergency) notesArr.push(`Emergência: ${mergedEmergency}`);
        if (mergedHealth) notesArr.push(`Saúde: ${mergedHealth}`);
        const notesStr = notesArr.join(' | ') || null;

        if (existing) {
          const updates = {};
          if (name && name !== existing.name) updates.name = name;
          if (email && email !== existing.email) updates.email = email;
          if (mergedCpf && mergedCpf !== existing.document) updates.document = mergedCpf;
          if (notesStr && notesStr !== existing.notes) updates.notes = notesStr;

          if (Object.keys(updates).length > 0) {
            try {
              await client.from('customers').update(updates).eq('id', existing.id);
            } catch(e) {
              console.warn('Aviso ao atualizar cliente no Supabase:', e);
            }
          }
          return {
            ...existing,
            ...updates,
            cpf: mergedCpf,
            document: mergedCpf,
            birth_date: mergedBirth,
            emergency_contact: mergedEmergency,
            emergencyContact: mergedEmergency,
            health_notes: mergedHealth
          };
        }

        const newId = 'cust-' + Date.now();
        const payload = {
          id: newId,
          name: name || 'Cliente',
          phone: phone || '',
          email: email || '',
          document: mergedCpf || null,
          notes: notesStr
        };

        const { data: created, error } = await client
          .from('customers')
          .insert([payload])
          .select()
          .single();

        if (!error && created) {
          return {
            ...created,
            cpf: mergedCpf,
            document: mergedCpf,
            birth_date: mergedBirth,
            emergency_contact: mergedEmergency,
            emergencyContact: mergedEmergency,
            health_notes: mergedHealth
          };
        }

        // Fallback: tenta sem campos adicionais apenas se falhar
        const { data: fallbackCreated } = await client
          .from('customers')
          .insert([{ id: newId, name: name || 'Cliente', phone: phone || '', email: email || '' }])
          .select()
          .single();

        return fallbackCreated ? {
          ...fallbackCreated,
          cpf: mergedCpf,
          document: mergedCpf,
          birth_date: mergedBirth,
          emergency_contact: mergedEmergency,
          emergencyContact: mergedEmergency,
          health_notes: mergedHealth
        } : {
          id: newId,
          name,
          phone,
          email,
          document: mergedCpf,
          cpf: mergedCpf,
          emergency_contact: mergedEmergency,
          emergencyContact: mergedEmergency,
          birth_date: mergedBirth,
          health_notes: mergedHealth,
          ...extraData
        };
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
