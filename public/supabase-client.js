// Cliente de Conexão com o Supabase da Arena Limoeiro - Arquitetura Dupla (2 em 1)
// Banco 1 (Principal/Exibição) + Banco 2 (Secundário/Cópia Leve & Salvaguarda Ativa)
(function() {
  const STORAGE_KEY = 'arena_supabase_config';
  
  // Configuração padrão com suporte a Banco Duplo (2 em 1)
  function getConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          url: parsed.url || window.SUPABASE_URL || 'https://brmclyukjfijommbxhks.supabase.co',
          anonKey: parsed.anonKey || window.SUPABASE_ANON_KEY || 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7',
          secondaryUrl: parsed.secondaryUrl || window.SUPABASE_SECONDARY_URL || 'https://aukrcnhuyultkjqsgvea.supabase.co',
          secondaryAnonKey: parsed.secondaryAnonKey || window.SUPABASE_SECONDARY_ANON_KEY || 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi',
          dualWrite: parsed.dualWrite !== false,
          autoFailover: parsed.autoFailover !== false,
          connected: !!parsed.connected,
          secondaryConnected: !!parsed.secondaryConnected
        };
      }
    } catch (e) {}
    
    return {
      url: window.SUPABASE_URL || 'https://brmclyukjfijommbxhks.supabase.co',
      anonKey: window.SUPABASE_ANON_KEY || 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7',
      secondaryUrl: window.SUPABASE_SECONDARY_URL || 'https://aukrcnhuyultkjqsgvea.supabase.co',
      secondaryAnonKey: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi',
      dualWrite: true,
      autoFailover: true,
      connected: true,
      secondaryConnected: false
    };
  }

  let client1 = null;
  let client2 = null;
  let primaryRestricted = false; // Flag para erro 402 exceed_egress_quota ou indisponibilidade

  function createSingleClient(url, key) {
    if (!url || !key || !window.supabase || !window.supabase.createClient) return null;
    try {
      const cleanUrl = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
      return window.supabase.createClient(cleanUrl, key.trim(), {
        auth: { persistSession: true },
        realtime: { params: { eventsPerSecond: 10 } }
      });
    } catch (err) {
      console.warn('Erro ao criar cliente Supabase para:', url, err);
      return null;
    }
  }

  function initClients() {
    const config = getConfig();
    if (config.url && config.anonKey) {
      client1 = createSingleClient(config.url, config.anonKey);
    }
    if (config.secondaryUrl && config.secondaryAnonKey) {
      client2 = createSingleClient(config.secondaryUrl, config.secondaryAnonKey);
    } else {
      client2 = null;
    }
  }

  // Verifica se o erro indica bloqueio de cota ou indisponibilidade do banco
  function isRestrictedError(error) {
    if (!error) return false;
    const msg = String(error.message || error.details || error || '').toLowerCase();
    const code = String(error.code || error.status || '');
    return code === '402' ||
      code === '429' ||
      msg.includes('exceed_egress_quota') ||
      msg.includes('restricted') ||
      msg.includes('spend caps') ||
      msg.includes('quota') ||
      msg.includes('networkerror') ||
      msg.includes('failed to fetch');
  }

  // Cria um Proxy Builder que intercepta chamadas a tabelas PostgREST
  // Realiza: Failover transparente em leituras e Dual-Write com cópia leve assíncrona em escritas
  function createSmartProxyClient() {
    return {
      from(tableName) {
        return createTableProxy(tableName);
      },
      channel(name, opts) {
        const c = (!primaryRestricted && client1) ? client1 : (client2 || client1);
        return c ? c.channel(name, opts) : null;
      },
      get auth() {
        const c = (!primaryRestricted && client1) ? client1 : (client2 || client1);
        return c ? c.auth : null;
      }
    };
  }

  function createTableProxy(tableName) {
    const operations = {
      isWrite: false,
      writeMethod: null,
      writeArgs: null
    };

    // Objeto intermediário para montar a query de forma fluente
    const builderProxy = {
      _calls: [],
      
      select(...args) {
        this._calls.push({ method: 'select', args });
        return this;
      },
      insert(...args) {
        operations.isWrite = true;
        operations.writeMethod = 'insert';
        operations.writeArgs = args;
        this._calls.push({ method: 'insert', args });
        return this;
      },
      upsert(...args) {
        operations.isWrite = true;
        operations.writeMethod = 'upsert';
        operations.writeArgs = args;
        this._calls.push({ method: 'upsert', args });
        return this;
      },
      update(...args) {
        operations.isWrite = true;
        operations.writeMethod = 'update';
        operations.writeArgs = args;
        this._calls.push({ method: 'update', args });
        return this;
      },
      delete(...args) {
        operations.isWrite = true;
        operations.writeMethod = 'delete';
        operations.writeArgs = args;
        this._calls.push({ method: 'delete', args });
        return this;
      },
      eq(...args) { this._calls.push({ method: 'eq', args }); return this; },
      neq(...args) { this._calls.push({ method: 'neq', args }); return this; },
      gt(...args) { this._calls.push({ method: 'gt', args }); return this; },
      gte(...args) { this._calls.push({ method: 'gte', args }); return this; },
      lt(...args) { this._calls.push({ method: 'lt', args }); return this; },
      lte(...args) { this._calls.push({ method: 'lte', args }); return this; },
      like(...args) { this._calls.push({ method: 'like', args }); return this; },
      ilike(...args) { this._calls.push({ method: 'ilike', args }); return this; },
      is(...args) { this._calls.push({ method: 'is', args }); return this; },
      in(...args) { this._calls.push({ method: 'in', args }); return this; },
      order(...args) { this._calls.push({ method: 'order', args }); return this; },
      limit(...args) { this._calls.push({ method: 'limit', args }); return this; },
      range(...args) { this._calls.push({ method: 'range', args }); return this; },
      single(...args) { this._calls.push({ method: 'single', args }); return this; },
      maybeSingle(...args) { this._calls.push({ method: 'maybeSingle', args }); return this; },

      // Execução da Query com Failover Inteligente e Cópia Leve
      async then(resolve, reject) {
        try {
          const cfg = getConfig();
          const targetClient = (!primaryRestricted && client1) ? client1 : (client2 || client1);

          // Se for operação de escrita:
          if (operations.isWrite && cfg.dualWrite && client2) {
            // Despacha cópia leve assíncrona para o Banco 2
            dispatchLightweightCopy(tableName, operations, this._calls).catch(() => {});
          }

          let result = null;
          let primaryFailed = false;

          if (client1 && !primaryRestricted) {
            try {
              let query = client1.from(tableName);
              for (const call of this._calls) {
                if (typeof query[call.method] === 'function') {
                  query = query[call.method](...call.args);
                }
              }
              result = await query;
              if (result && result.error && isRestrictedError(result.error)) {
                console.warn('⚠️ [Banco 1] Restrição detectada no Banco Principal:', result.error.message);
                primaryRestricted = true;
                primaryFailed = true;
              }
            } catch (err) {
              if (isRestrictedError(err)) {
                primaryRestricted = true;
              }
              primaryFailed = true;
            }
          } else {
            primaryFailed = true;
          }

          // Se o Banco 1 falhou e temos Banco 2 (Regra: O Segundo interfere no Primeiro para salvar os dados):
          if (primaryFailed && client2) {
            try {
              let query2 = client2.from(tableName);
              for (const call of this._calls) {
                if (typeof query2[call.method] === 'function') {
                  query2 = query2[call.method](...call.args);
                }
              }
              result = await query2;
              console.log('🛡️ [Banco 2] Operação realizada com sucesso no Banco Reserva!');
            } catch (secErr) {
              result = { data: null, error: secErr };
            }
          }

          if (!result) {
            result = { data: null, error: new Error('Nenhum banco de dados disponível.') };
          }

          if (resolve) resolve(result);
          return result;
        } catch (fatalErr) {
          if (reject) reject(fatalErr);
          else throw fatalErr;
        }
      }
    };

    return builderProxy;
  }

  // Despacha uma cópia leve em tempo real para o Banco 2 (Delta Sync Assíncrono)
  async function dispatchLightweightCopy(tableName, operations, calls) {
    if (!client2) return;
    try {
      let q2 = client2.from(tableName);
      for (const call of calls) {
        if (typeof q2[call.method] === 'function') {
          q2 = q2[call.method](...call.args);
        }
      }
      const res = await q2;
      if (res && res.error) {
        console.warn(`[Banco 2 - Cópia Leve] Aviso em ${tableName}:`, res.error.message);
      } else {
        console.log(`✓ [Banco 2 - Cópia Leve] Sincronizado com sucesso: ${tableName}`);
      }
    } catch (e) {
      console.warn(`[Banco 2 - Cópia Leve] Erro assíncrono em ${tableName}:`, e?.message || e);
    }
  }

  let smartProxyInstance = null;

  window.ArenaSupabase = {
    getConfig,

    // Salva configuração de ambos os bancos (Banco 1 e Banco 2)
    async saveDualConfig({ url, anonKey, secondaryUrl, secondaryAnonKey, dualWrite = true, autoFailover = true }) {
      const cleanUrl1 = (url || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
      const cleanKey1 = (anonKey || '').trim();
      const cleanUrl2 = (secondaryUrl || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
      const cleanKey2 = (secondaryAnonKey || '').trim();

      const cfg = {
        url: cleanUrl1 || 'https://brmclyukjfijommbxhks.supabase.co',
        anonKey: cleanKey1 || 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7',
        secondaryUrl: cleanUrl2,
        secondaryAnonKey: cleanKey2,
        dualWrite: dualWrite !== false,
        autoFailover: autoFailover !== false,
        connected: false,
        secondaryConnected: false
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      initClients();
      primaryRestricted = false;
      return await this.testBothConnections();
    },

    // Compatibilidade com a chamada legada saveConfig(url, anonKey)
    saveConfig(url, anonKey) {
      const current = getConfig();
      return this.saveDualConfig({
        url,
        anonKey,
        secondaryUrl: current.secondaryUrl,
        secondaryAnonKey: current.secondaryAnonKey,
        dualWrite: current.dualWrite,
        autoFailover: current.autoFailover
      });
    },

    disconnect() {
      localStorage.removeItem(STORAGE_KEY);
      client1 = null;
      client2 = null;
      primaryRestricted = false;
      smartProxyInstance = null;
    },

    // Retorna o cliente inteligente 2 em 1
    getClient() {
      if (!client1 && !client2) initClients();
      if (!smartProxyInstance) {
        smartProxyInstance = createSmartProxyClient();
      }
      return smartProxyInstance;
    },

    getPrimaryClient() {
      if (!client1) initClients();
      return client1;
    },

    getSecondaryClient() {
      if (!client2) initClients();
      return client2;
    },

    isReady() {
      return !!(client1 || client2);
    },

    // Testa a conexão de ambos os bancos
    async testBothConnections() {
      initClients();
      const results = {
        db1: { success: false, message: 'Não configurado' },
        db2: { success: false, message: 'Não configurado' },
        isDualActive: false
      };

      if (client1) {
        try {
          const { data, error } = await client1.from('courts').select('id').limit(1);
          if (error) {
            results.db1 = { success: false, message: error.message };
            if (isRestrictedError(error)) {
              primaryRestricted = true;
              results.db1.restricted = true;
            }
          } else {
            results.db1 = { success: true, message: 'Conectado com sucesso!' };
            primaryRestricted = false;
          }
        } catch (err) {
          results.db1 = { success: false, message: err.message || 'Erro de rede' };
        }
      }

      if (client2) {
        try {
          const { data, error } = await client2.from('courts').select('id').limit(1);
          if (error) {
            results.db2 = { success: false, message: error.message };
          } else {
            results.db2 = { success: true, message: 'Conectado com sucesso!' };
          }
        } catch (err) {
          results.db2 = { success: false, message: err.message || 'Erro de rede' };
        }
      }

      const cfg = getConfig();
      cfg.connected = results.db1.success;
      cfg.secondaryConnected = results.db2.success;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));

      results.isDualActive = results.db1.success && results.db2.success;
      results.hasActiveDatabase = results.db1.success || results.db2.success;

      return results;
    },

    // Compatibilidade com chamada legada testConnection()
    async testConnection() {
      const dual = await this.testBothConnections();
      if (dual.db1.success) {
        return { success: true, message: 'Banco Principal Conectado!' + (dual.db2.success ? ' (Banco 2 Conectado e Ativo em Modo 2 em 1)' : '') };
      }
      if (dual.db2.success) {
        return { success: true, message: 'Banco Reserva Conectado e Operando como Salvaguarda Ativa!' };
      }
      return { success: false, message: dual.db1.message || dual.db2.message || 'Falha ao conectar.' };
    },

    // Reconciliação / Cópia Leve de Segurança em lote para o Banco 2
    async reconcileToSecondary(stateData) {
      if (!client2 || !stateData) return { success: false, message: 'Banco 2 não configurado.' };
      console.log('🔄 Iniciando Reconciliação / Cópia Leve para o Banco 2...');
      try {
        if (Array.isArray(stateData.courts) && stateData.courts.length > 0) {
          await client2.from('courts').upsert(stateData.courts, { onConflict: 'id' }).catch(() => null);
        }
        if (Array.isArray(stateData.products) && stateData.products.length > 0) {
          await client2.from('products').upsert(stateData.products, { onConflict: 'id' }).catch(() => null);
        }
        if (Array.isArray(stateData.customers) && stateData.customers.length > 0) {
          await client2.from('customers').upsert(stateData.customers, { onConflict: 'id' }).catch(() => null);
        }
        if (Array.isArray(stateData.bookings) && stateData.bookings.length > 0) {
          // Chunk de 30 agendamentos por vez para ser ultra-leve
          for (let i = 0; i < stateData.bookings.length; i += 30) {
            const chunk = stateData.bookings.slice(i, i + 30);
            await client2.from('bookings').upsert(chunk, { onConflict: 'id' }).catch(() => null);
          }
        }
        if (Array.isArray(stateData.monthlyMembers) && stateData.monthlyMembers.length > 0) {
          await client2.from('monthly_members').upsert(stateData.monthlyMembers, { onConflict: 'id' }).catch(() => null);
        }
        console.log('✓ Reconciliação concluída com sucesso no Banco 2!');
        return { success: true };
      } catch (err) {
        console.warn('Aviso durante reconciliação:', err);
        return { success: false, error: err.message };
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

    // Buscar ou Criar Cliente com Gravação Dupla Inteligente
    async getOrCreateCustomer(name, phone, email = '', extraData = {}) {
      const client = this.getClient();
      if (!client) return { id: 'cust-local-' + Date.now(), name, phone, email, ...extraData };

      try {
        const cleanPhone = (phone || '').replace(/\D/g, '');
        let existing = null;

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
              console.warn('Aviso ao atualizar cliente:', e);
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
        if (this._broadcastChannel && typeof this._broadcastChannel.subscribe === 'function') {
          this._broadcastChannel.subscribe();
        }
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
    }
  };

  // Inicializa clientes na carga
  initClients();

  // ☁️ Sincronização em Nuvem de Alta Velocidade (Realtime Cross-Device Sync)
  const SYNC_API_ENDPOINT = (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('capacitor://') && !window.location.origin.includes('file://'))
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
      } catch (err) {}
      return null;
    },

    async push(action, payload) {
      try {
        // Envia para a API de Sincronização Cloud
        const res = await fetch(SYNC_API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload })
        });

        // E se houver Banco 2 conectado, replica cópia leve direta
        if (window.ArenaSupabase && client2) {
          try {
            if (action === 'push_booking' && payload && payload.id) {
              client2.from('bookings').upsert([payload], { onConflict: 'id' }).then(() => {});
            } else if (action === 'delete_booking' && payload && payload.id) {
              client2.from('bookings').delete().eq('id', payload.id).then(() => {});
            } else if (action === 'push_monthly' && payload && payload.id) {
              client2.from('monthly_members').upsert([payload], { onConflict: 'id' }).then(() => {});
            } else if (action === 'delete_monthly' && payload && payload.id) {
              client2.from('monthly_members').delete().eq('id', payload.id).then(() => {});
            }
          } catch(e) {}
        }

        if (!res.ok) return false;
        const json = await res.json();
        return json && json.success;
      } catch (err) {
        return false;
      }
    }
  };
})();
