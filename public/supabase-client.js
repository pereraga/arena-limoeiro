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
          const current = getConfig();
          current.connected = false;
          current.lastError = error.message;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
          return { 
            success: false, 
            message: error.message, 
            isQuota: error.message.includes('exceed_egress_quota') 
          };
        }
        
        // Marca como conectado
        const current = getConfig();
        current.connected = true;
        current.lastError = null;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));

        return { success: true, message: 'Conectado com sucesso ao Supabase!' };
      } catch (err) {
        const current = getConfig();
        current.connected = false;
        current.lastError = err.message;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
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
    },

    broadcastBookingDelete(deletePayload) {
      try {
        const chan = this.getBroadcastChannel();
        if (chan) {
          chan.send({
            type: 'broadcast',
            event: 'booking_deleted',
            payload: deletePayload
          });
        }
      } catch (err) {
        console.warn('Erro ao transmitir broadcast de exclusão de jogo:', err);
      }
    },

    broadcastSystemLog(logEntry) {
      try {
        const chan = this.getBroadcastChannel();
        if (chan) {
          chan.send({
            type: 'broadcast',
            event: 'system_log',
            payload: logEntry
          });
        }
      } catch (err) {
        console.warn('Erro ao transmitir broadcast de log de sistema:', err);
      }
    },

    broadcastClearLogs() {
      try {
        const chan = this.getBroadcastChannel();
        if (chan) {
          chan.send({
            type: 'broadcast',
            event: 'clear_logs',
            payload: { timestamp: new Date().toISOString() }
          });
        }
      } catch (err) {
        console.warn('Erro ao transmitir broadcast de limpeza de logs:', err);
      }
    },

    // 📦 FILA DE SINCRONIZAÇÃO OFFLINE (RESISTÊNCIA A QUEDA DE CONEXÃO OU LIMITE DE COTA)
    getPendingQueue() {
      try {
        const raw = localStorage.getItem('arena_offline_sync_queue');
        return raw ? JSON.parse(raw) : [];
      } catch(e) {
        return [];
      }
    },

    addToPendingQueue(item) {
      try {
        const q = this.getPendingQueue();
        q.push({
          ...item,
          queued_at: new Date().toISOString()
        });
        localStorage.setItem('arena_offline_sync_queue', JSON.stringify(q));
      } catch(e) {}
    },

    async flushPendingQueue() {
      const client = this.getClient();
      if (!client) return { flushed: 0, remaining: 0 };
      const q = this.getPendingQueue();
      if (!q.length) return { flushed: 0, remaining: 0 };

      const remaining = [];
      let flushed = 0;

      for (const item of q) {
        try {
          if (item.action === 'insert') {
            const { error } = await client.from(item.table).insert(Array.isArray(item.payload) ? item.payload : [item.payload]);
            if (error) throw error;
          } else if (item.action === 'upsert') {
            const { error } = await client.from(item.table).upsert(Array.isArray(item.payload) ? item.payload : [item.payload], { onConflict: item.onConflict || 'id' });
            if (error) throw error;
          } else if (item.action === 'update') {
            const { error } = await client.from(item.table).update(item.payload).eq('id', item.id);
            if (error) throw error;
          } else if (item.action === 'delete') {
            const { error } = await client.from(item.table).delete().eq('id', item.id);
            if (error) throw error;
          }
          flushed++;
        } catch(err) {
          console.warn('Erro ao processar item da fila offline:', err);
          remaining.push(item);
        }
      }

      localStorage.setItem('arena_offline_sync_queue', JSON.stringify(remaining));
      return { flushed, remaining: remaining.length };
    },

    // 🚀 ENVIO EM MASSA DE TODOS OS DADOS LOCAIS PARA O SUPABASE (RESTAURAÇÃO COMPLETA)
    async pushAllLocalData(data) {
      const client = this.getClient();
      if (!client) return { success: false, message: 'Cliente Supabase não inicializado.' };

      const results = {
        courts: 0,
        products: 0,
        customers: 0,
        monthlyMembers: 0,
        bookings: 0,
        errors: []
      };

      try {
        // 1. Quadras
        if (Array.isArray(data.courts) && data.courts.length > 0) {
          const courtsPayload = data.courts.map((c, idx) => ({
            id: c.id,
            name: c.name,
            category: c.category,
            category_label: c.categoryLabel || c.category_label || 'Quadra',
            image: c.image || null,
            base_price_per_hour: Number(c.basePricePerHour || c.base_price_per_hour || 90),
            monthly_price: Number(c.monthlyPrice || c.monthly_price || 500),
            badge: c.badge || null,
            bookings_count: Number(c.bookingsCount || c.bookings_count || 0),
            order_index: c.orderIndex || c.order_index || (idx + 1),
            description: c.description || null,
            observation: c.observation || null,
            specs: typeof c.specs === 'object' ? c.specs : {}
          }));
          const { error: courtsErr } = await client.from('courts').upsert(courtsPayload, { onConflict: 'id' });
          if (courtsErr) results.errors.push('Quadras: ' + courtsErr.message);
          else results.courts = courtsPayload.length;
        }

        // 2. Produtos de Bar
        if (Array.isArray(data.products) && data.products.length > 0) {
          const prodsPayload = data.products
            .filter(p => p && p.id && p.id !== 'arena-water-supply' && p.type !== 'water_supply')
            .map(p => ({
              id: p.id,
              name: p.name,
              category: p.category || 'Bebidas',
              type: p.type || 'product',
              price: Number(p.price || 0),
              unit: p.unit || 'unid.',
              image: p.image || null
            }));
          if (prodsPayload.length > 0) {
            const { error: prodsErr } = await client.from('products').upsert(prodsPayload, { onConflict: 'id' });
            if (prodsErr) results.errors.push('Produtos: ' + prodsErr.message);
            else results.products = prodsPayload.length;
          }
        }

        // 3. Estoque de Água
        if (data.waterSupply) {
          try {
            const waterPayload = {
              id: 'arena-water-supply',
              name: 'Estoque Central de Água Mineral da Arena',
              category: 'Estoque / Controle Interno',
              type: 'water_supply',
              price: Number(data.waterSupply.unit_price || 0.75),
              unit: 'garrafão',
              image: JSON.stringify(data.waterSupply)
            };
            await client.from('products').upsert([waterPayload], { onConflict: 'id' });
          } catch(wErr) {}
        }

        // 4. Clientes
        if (Array.isArray(data.customers) && data.customers.length > 0) {
          const custPayload = data.customers
            .filter(c => c && c.id && c.name && c.name !== '__DELETED_CUSTOMER__' && !String(c.id).startsWith('deleted_'))
            .map(c => ({
              id: c.id,
              name: c.name,
              phone: c.phone || '',
              email: c.email || '',
              document: c.document || c.cpf || null,
              notes: c.notes || (c.emergency_contact ? `Emergência: ${c.emergency_contact}` : null)
            }));
          if (custPayload.length > 0) {
            const { error: custErr } = await client.from('customers').upsert(custPayload, { onConflict: 'id' });
            if (custErr) results.errors.push('Clientes: ' + custErr.message);
            else results.customers = custPayload.length;
          }
        }

        // 5. Mensalistas
        if (Array.isArray(data.monthlyMembers) && data.monthlyMembers.length > 0) {
          const membersPayload = data.monthlyMembers
            .filter(m => m && m.id && !m.id.startsWith('mock-'))
            .map(m => ({
              id: m.id,
              team_name: m.team_name || m.teamName || 'Mensalista',
              responsible_name: m.responsible_name || m.responsibleName || 'Responsável',
              phone: m.phone || '',
              customer_id: m.customer_id || null,
              court_id: m.court_id || m.courtId || null,
              day_of_week: m.day_of_week || m.dayOfWeek || 'segunda',
              day_of_week_label: m.day_of_week_label || m.dayOfWeekLabel || 'Toda semana',
              time: m.time || m.start_time || '19:00',
              start_time: m.start_time || m.startTime || m.time || '19:00',
              end_time: m.end_time || m.endTime || '20:00',
              monthly_price: Number(m.monthly_price || m.monthlyPrice || 500),
              status: m.status || 'active',
              start_month: m.start_month || null,
              observation: m.observation || null
            }));
          if (membersPayload.length > 0) {
            const { error: memErr } = await client.from('monthly_members').upsert(membersPayload, { onConflict: 'id' });
            if (memErr) results.errors.push('Mensalistas: ' + memErr.message);
            else results.monthlyMembers = membersPayload.length;
          }
        }

        // 6. Agendamentos
        if (Array.isArray(data.bookings) && data.bookings.length > 0) {
          const bookingsPayload = data.bookings
            .filter(b => b && b.id && b.status !== 'cancelled')
            .map(b => ({
              id: b.id,
              court_id: b.court_id || b.courtId,
              customer_id: b.customer_id || null,
              date: b.date,
              start_time: b.start_time || b.startTime,
              end_time: b.end_time || b.endTime,
              time: b.time || `${b.start_time || b.startTime} às ${b.end_time || b.endTime}`,
              duration: Number(b.duration || 60),
              customer_name: b.customer_name || b.customerName || 'Cliente',
              customer_phone: b.customer_phone || b.customerPhone || '',
              total_price: Number(b.total_price || b.totalPrice || 0),
              status: b.status || 'confirmed',
              booking_type: b.booking_type || b.bookingType || 'avulso',
              payment_method: b.payment_method || b.paymentMethod || 'local',
              product_cart: b.product_cart || b.productCart || {},
              observation: b.observation || null
            }));
          if (bookingsPayload.length > 0) {
            const { error: bErr } = await client.from('bookings').upsert(bookingsPayload, { onConflict: 'id' });
            if (bErr) results.errors.push('Agendamentos: ' + bErr.message);
            else results.bookings = bookingsPayload.length;
          }
        }

        const success = results.errors.length === 0;
        return {
          success,
          results,
          message: success 
            ? `Sincronização concluída com sucesso! (${results.courts} quadras, ${results.bookings} agendamentos, ${results.customers} clientes, ${results.monthlyMembers} mensalistas, ${results.products} produtos).`
            : `Alguns itens não puderam ser sincronizados: ${results.errors.join('; ')}`
        };
      } catch(err) {
        return { success: false, message: err.message, results };
      }
    }
  };

  // ==============================================================================
  // ☁️ MOTOR DE SINCRONIZAÇÃO AUTOMÁTICA EM NUVEM (ZERO INTERVENÇÃO DO USUÁRIO)
  // Sincroniza Web, Celular, APK e Painel de Controle sem depender de cota do Supabase
  // ==============================================================================
  const SYNC_API_ENDPOINT = (window.location.origin && !window.location.origin.includes('capacitor://') && !window.location.origin.includes('file://'))
    ? '/api/sync'
    : 'https://arenalimoeiro.vercel.app/api/sync';

  window.ArenaCloudSync = {
    endpoint: SYNC_API_ENDPOINT,

    async pull() {
      try {
        const res = await fetch(SYNC_API_ENDPOINT + '?_t=' + Date.now(), {
          headers: { 'Cache-Control': 'no-cache, no-store' }
        });
        if (!res.ok) return null;
        const json = await res.json();
        if (json && json.success && json.data) {
          return json.data;
        }
      } catch (err) {
        // Silencioso se offline
      }
      return null;
    },

    async push(action, payload) {
      try {
        const res = await fetch(SYNC_API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        return json && json.success;
      } catch (err) {
        // Enfileira localmente se falhar a rede para envio posterior
        this.addToQueue({ action, payload, time: Date.now() });
        return false;
      }
    },

    getQueue() {
      try {
        return JSON.parse(localStorage.getItem('arena_cloud_sync_queue') || '[]');
      } catch(e) { return []; }
    },

    addToQueue(item) {
      try {
        const q = this.getQueue();
        q.push(item);
        localStorage.setItem('arena_cloud_sync_queue', JSON.stringify(q));
      } catch(e) {}
    },

    async flushQueue() {
      const q = this.getQueue();
      if (!q || q.length === 0) return;
      const remaining = [];
      for (const item of q) {
        try {
          const res = await fetch(SYNC_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: item.action, payload: item.payload })
          });
          if (!res.ok) remaining.push(item);
        } catch(e) {
          remaining.push(item);
        }
      }
      localStorage.setItem('arena_cloud_sync_queue', JSON.stringify(remaining));
    }
  };

  // Inicializa na carga
  initClient();
})();
