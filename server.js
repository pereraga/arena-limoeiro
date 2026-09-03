import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { arenaInfo, initialAdmins, categories, initialCourts, initialProducts, initialMonthlyMembers, initialBookings, coupons } from './data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Estado em memória
let admins = [...initialAdmins];
let courts = [...initialCourts];
let products = [...initialProducts];
let monthlyMembers = [...initialMonthlyMembers];
let allBookings = [...initialBookings];
let blockedByAdmin = new Map();

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getDaySchedule(courtId, date) {
  const operatingHours = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
  ];

  const [y, m, d] = date.split('-');
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const weekDaysMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const currentDayOfWeek = weekDaysMap[dateObj.getDay()];

  return operatingHours.map(time => {
    const key = `${courtId}_${date}_${time}`;
    const slotMin = timeToMinutes(time);
    
    if (blockedByAdmin.has(key)) {
      return {
        time,
        status: "blocked_admin",
        statusLabel: "Manutenção",
        isAvailable: false
      };
    }

    // Verifica mensalista fixo naquele dia da semana
    const monthlyHolder = monthlyMembers.find(m => {
      if (m.courtId !== courtId || m.dayOfWeek !== currentDayOfWeek || m.status !== 'active') return false;
      if (m.startTime && m.endTime) {
        const s = timeToMinutes(m.startTime);
        const e = timeToMinutes(m.endTime);
        return slotMin >= s && slotMin < e;
      }
      return m.time === time;
    });

    if (monthlyHolder) {
      return {
        time,
        status: "booked",
        statusLabel: "Mensalista Fixo",
        isMensalista: true,
        customerName: `${monthlyHolder.teamName} (${monthlyHolder.responsibleName})`,
        isAvailable: false
      };
    }

    // Verifica agendamento regular existente
    const existingBooking = allBookings.find(b => {
      if (b.courtId !== courtId || b.date !== date) return false;
      if (b.startTime && b.endTime) {
        const s = timeToMinutes(b.startTime);
        const e = timeToMinutes(b.endTime);
        return slotMin >= s && slotMin < e;
      }
      if (b.time && b.time.includes(' às ')) {
        const [sStr, eStr] = b.time.split(' às ');
        const s = timeToMinutes(sStr);
        const e = timeToMinutes(eStr);
        return slotMin >= s && slotMin < e;
      }
      return b.time === time;
    });

    if (existingBooking) {
      return {
        time,
        status: "booked",
        statusLabel: "Reservado",
        bookingId: existingBooking.id,
        customerName: existingBooking.customerName,
        isAvailable: false
      };
    }

    return {
      time,
      status: "available",
      statusLabel: "Disponível",
      isAvailable: true
    };
  });
}

// ROTAS DE AUTENTICAÇÃO
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Informe e-mail e senha" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = admins.find(a => a.email.toLowerCase() === cleanEmail && a.password === password);

  if (!user) {
    return res.status(401).json({ success: false, message: "E-mail ou senha incorretos." });
  }

  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

app.get('/api/auth/users', (req, res) => {
  const safeUsers = admins.map(a => ({
    id: a.id, name: a.name, email: a.email, role: a.role, createdAt: a.createdAt, password: a.password
  }));
  res.json(safeUsers);
});

app.post('/api/auth/users', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Preencha todos os campos obrigatórios." });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (admins.some(a => a.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ success: false, message: "Este e-mail já está cadastrado." });
  }

  const newAdmin = {
    id: `admin-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    password: password.trim(),
    role: role || "Gerente de Turno",
    createdAt: new Date().toLocaleDateString('pt-BR')
  };

  admins.push(newAdmin);
  res.status(201).json({ success: true, user: newAdmin });
});

app.delete('/api/auth/users/:id', (req, res) => {
  const { id } = req.params;
  if (admins.length <= 1) {
    return res.status(400).json({ success: false, message: "Não é possível remover o único administrador." });
  }
  admins = admins.filter(a => a.id !== id);
  res.json({ success: true, id });
});

app.get('/api/info', (req, res) => {
  res.json({ arenaInfo, categories });
});

// Quadras e Espaços
app.get('/api/courts', (req, res) => {
  const sorted = [...courts].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  res.json(sorted);
});

app.post('/api/courts/reorder', (req, res) => {
  const { courtIds } = req.body;
  if (!Array.isArray(courtIds)) return res.status(400).json({ error: "courtIds inválido" });

  courtIds.forEach((id, index) => {
    const court = courts.find(c => c.id === id);
    if (court) court.orderIndex = index + 1;
  });

  const sorted = [...courts].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  io.emit('courts_reordered', sorted);
  res.json({ success: true, courts: sorted });
});

app.post('/api/courts', (req, res) => {
  const newCourt = req.body;
  const id = `court-${newCourt.category || 'society'}-${Date.now()}`;
  const courtObj = {
    id,
    ...newCourt,
    orderIndex: courts.length + 1,
    bookingsCount: 0,
    sampleMensalistas: ["Pelada da Semana (Terça 19h)", "Galera do Jogo (Quinta 20h)"],
    specs: newCourt.specs || {
      type: "Piso Esportivo Oficial",
      capacity: "14 a 16 Jogadores",
      features: ["Iluminação LED", "Vestiários"],
      status: "Disponível"
    }
  };
  courts.push(courtObj);
  io.emit('court_added', courtObj);
  res.status(201).json(courtObj);
});

app.put('/api/courts/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const index = courts.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: "Quadra não encontrada" });

  courts[index] = { ...courts[index], ...updatedData, id };
  io.emit('court_updated', courts[index]);
  res.json(courts[index]);
});

app.delete('/api/courts/:id', (req, res) => {
  const { id } = req.params;
  courts = courts.filter(c => c.id !== id);
  io.emit('court_deleted', { id });
  res.json({ success: true, id });
});

// Produtos
app.get('/api/products', (req, res) => res.json(products));

app.post('/api/products', (req, res) => {
  const newProd = req.body;
  const id = `prod-${Date.now()}`;
  const prodObj = { id, ...newProd };
  products.push(prodObj);
  io.emit('product_added', prodObj);
  res.status(201).json(prodObj);
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  products = products.filter(p => p.id !== id);
  io.emit('product_deleted', { id });
  res.json({ success: true, id });
});

// Mensalistas
app.get('/api/monthly-members', (req, res) => res.json(monthlyMembers));

app.post('/api/monthly-members', (req, res) => {
  const newMemberData = req.body;
  const memberId = `mensal-${Date.now()}`;

  const weekLabels = {
    domingo: "Todo Domingo", segunda: "Toda Segunda-feira", terca: "Toda Terça-feira",
    quarta: "Toda Quarta-feira", quinta: "Toda Quinta-feira", sexta: "Toda Sexta-feira", sabado: "Todo Sábado"
  };

  const createdMember = {
    id: memberId,
    teamName: newMemberData.teamName || "Time Mensalista",
    responsibleName: newMemberData.responsibleName,
    phone: newMemberData.phone,
    courtId: newMemberData.courtId,
    dayOfWeek: newMemberData.dayOfWeek,
    dayOfWeekLabel: weekLabels[newMemberData.dayOfWeek] || "Dia Fixo",
    time: newMemberData.time,
    startTime: newMemberData.time,
    endTime: newMemberData.endTime || minutesToTime(timeToMinutes(newMemberData.time) + 60),
    monthlyPrice: Number(newMemberData.monthlyPrice) || 480.00,
    status: "active",
    startMonth: newMemberData.startMonth || "Setembro/2026",
    observation: newMemberData.observation || ""
  };

  monthlyMembers.push(createdMember);
  io.emit('monthly_member_added', createdMember);
  res.status(201).json(createdMember);
});

app.delete('/api/monthly-members/:id', (req, res) => {
  const { id } = req.params;
  monthlyMembers = monthlyMembers.filter(m => m.id !== id);
  io.emit('monthly_member_deleted', { id });
  res.json({ success: true, id });
});

app.get('/api/schedule', (req, res) => {
  const { courtId, date } = req.query;
  if (!courtId || !date) return res.status(400).json({ error: "courtId e date são obrigatórios" });
  res.json(getDaySchedule(courtId, date));
});

app.get('/api/bookings', (req, res) => res.json(allBookings));

app.post('/api/coupons/validate', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ valid: false, message: "Código não informado" });
  const cleanCode = code.toUpperCase().trim();
  const coupon = coupons[cleanCode];
  if (coupon) res.json({ valid: true, coupon: { code: cleanCode, ...coupon } });
  else res.json({ valid: false, message: "Cupom inválido ou expirado" });
});

function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Socket.io
io.on('connection', (socket) => {
  socket.emit('init_data', {
    arenaInfo,
    categories,
    courts,
    products,
    monthlyMembers,
    serverTime: new Date().toISOString()
  });

  socket.on('get_schedule', ({ courtId, date }) => {
    socket.emit('schedule_data', { courtId, date, schedule: getDaySchedule(courtId, date) });
  });

  socket.on('create_booking', (bookingData) => {
    const bookingId = `ARENA-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking = {
      id: bookingId,
      ...bookingData,
      status: "confirmed",
      createdAt: new Date().toISOString()
    };

    allBookings.push(newBooking);

    const court = courts.find(c => c.id === bookingData.courtId);
    if (court) court.bookingsCount = (court.bookingsCount || 0) + 1;

    io.emit('booking_created', { booking: newBooking, courtId: bookingData.courtId, date: bookingData.date });
    io.emit('schedule_updated', { courtId: bookingData.courtId, date: bookingData.date });
    socket.emit('booking_confirmed', { success: true, booking: newBooking });
  });

  socket.on('admin_toggle_slot', ({ courtId, date, time }) => {
    const key = `${courtId}_${date}_${time}`;
    if (blockedByAdmin.has(key)) blockedByAdmin.delete(key);
    else blockedByAdmin.set(key, { reason: "Manutenção" });
    io.emit('schedule_updated', { courtId, date });
  });
});

const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🏟️  ARENA LIMOEIRO - SISTEMA DE AGENDAMENTO E GESTÃO`);
    console.log(`⚡ Servidor ativo em: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

export default app;
