// Dados Iniciais e de Fallback da Arena Limoeiro para Vercel e Modo Offline
const arenaInfo = {
  name: "Arena Limoeiro",
  tagline: "Complexo Poliesportivo e Lazer",
  address: "Av. Principal, 1200 - Centro Esportivo - Limoeiro / PE",
  phone: "(81) 98765-4321",
  whatsapp: "5581987654321",
  openingHours: "06:00 às 23:00 (Segunda a Domingo)",
  logo: "/logo.jpg"
};

const initialAdmins = [
  {
    id: "admin-1",
    name: "Gabriel Alves",
    email: "admin@arenalimoeiro.com.br",
    password: "admin123",
    role: "Administrador Geral",
    createdAt: "01/09/2026"
  },
  {
    id: "admin-2",
    name: "Recepção & Atendimento",
    email: "recepcao@arenalimoeiro.com.br",
    password: "arena123",
    role: "Recepção & Atendimento",
    createdAt: "01/09/2026"
  }
];

const categories = [
  { id: "all", name: "Todos os Espaços", icon: "layout-grid" },
  { id: "society", name: "Futebol Society", icon: "trophy" },
  { id: "beach", name: "Beach Tennis & Vôlei", icon: "sun" },
  { id: "futsal", name: "Ginásio Poliesportivo", icon: "activity" },
  { id: "padel", name: "Padel & Tênis", icon: "flame" }
];

const initialCourts = [
  {
    id: "court-society-1",
    name: "Campo Society 01 - Grama Sintética Premium",
    category: "society",
    categoryLabel: "Futebol Society",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80",
    basePricePerHour: 140.00,
    monthlyPrice: 500.00,
    badge: "🔥 Mais Agendado da Semana",
    bookingsCount: 48,
    orderIndex: 1,
    description: "Campo de futebol society de alto padrão com dimensões oficiais, grama monofilamento macia e excelente drenagem.",
    observation: "Permitido apenas chuteiras society ou tênis (proibido travas de campo).",
    specs: {
      type: "Grama Sintética 60mm Monofilamento (FIFA Quality)",
      capacity: "14 a 16 Jogadores (7x7 / 8x8)",
      features: ["Iluminação LED 800W Pro", "Placar Eletrônico Digital", "Vestiários com Ducha Quente", "Churrasqueira Anexa"],
      status: "Disponível",
      discount_price_per_hour: 80.00,
      discount_start_time: "09:00",
      discount_end_time: "16:00"
    },
    discountPricePerHour: 80.00,
    discount_price_per_hour: 80.00,
    discountStartTime: "09:00",
    discountEndTime: "16:00"
  },
  {
    id: "court-society-2",
    name: "Campo Society 02 - Coberto Climatizado",
    category: "society",
    categoryLabel: "Futebol Society",
    image: "https://images.unsplash.com/photo-1529900245534-47fbf8204bca?w=800&auto=format&fit=crop&q=80",
    basePricePerHour: 160.00,
    monthlyPrice: 580.00,
    badge: "⚡ Alta Procura (100% Coberto)",
    bookingsCount: 42,
    orderIndex: 2,
    description: "Espaço 100% coberto e protegido de chuvas e sol forte, com ventilação forçada e amortecimento reforçado.",
    observation: "Espaço perfeito para dias de chuva ou jogos nos horários de pico.",
    specs: {
      type: "Grama Sintética Bicolor Coberta",
      capacity: "12 a 14 Jogadores (6x6 / 7x7)",
      features: ["100% Coberto (Sem chuva)", "Ventilação Forçada", "Gramado com Amortecimento", "Câmeras de Gravação"],
      status: "Disponível"
    }
  },
  {
    id: "court-beach-1",
    name: "Quadra de Areia A - Beach Tennis & Futevôlei",
    category: "beach",
    categoryLabel: "Beach Tennis / Futevôlei",
    image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop&q=80",
    basePricePerHour: 90.00,
    monthlyPrice: 320.00,
    badge: "🔥 Mais Agendado (Beach)",
    bookingsCount: 39,
    orderIndex: 3,
    description: "Quadra com areia fina e lavada que não esquenta o pé, nivelamento a laser e rede com regulagem de altura rápida.",
    observation: "Disponíveis duchas higiênicas logo na saída da quadra.",
    specs: {
      type: "Areia Especial Tratada e Filtrada (Não queima o pé)",
      capacity: "4 a 8 Jogadores",
      features: ["Rede Oficial Regulável", "Iluminação Noturna sem Ofuscamento", "Duchas ao Lado", "Kiosk Bar Próximo"],
      status: "Disponível",
      discount_price_per_hour: 60.00,
      discount_start_time: "09:00",
      discount_end_time: "16:00"
    },
    discountPricePerHour: 60.00,
    discount_price_per_hour: 60.00,
    discountStartTime: "09:00",
    discountEndTime: "16:00"
  },
  {
    id: "court-beach-2",
    name: "Quadra de Areia B - Beach Sports Master",
    category: "beach",
    categoryLabel: "Beach Tennis / Vôlei",
    image: "https://images.unsplash.com/photo-1592656094267-764a45160876?w=800&auto=format&fit=crop&q=80",
    basePricePerHour: 90.00,
    monthlyPrice: 320.00,
    badge: "Areia Branca",
    bookingsCount: 26,
    orderIndex: 4,
    description: "Ideal para torneios e jogos entre amigos de Beach Tennis, Vôlei de Praia e Futevôlei.",
    observation: "Consulte o aluguel de raquetes na recepção se necessário.",
    specs: {
      type: "Areia de Quartzo Branca Filtrada",
      capacity: "4 a 8 Jogadores",
      features: ["Rede de Futevôlei / Vôlei / Beach", "Refletores LED Direcionais", "Área de Descanso com Puffs"],
      status: "Disponível"
    }
  },
  {
    id: "court-gym-1",
    name: "Ginásio Poliesportivo 01 (Futsal, Basquete e Vôlei)",
    category: "futsal",
    categoryLabel: "Ginásio Poliesportivo",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80",
    basePricePerHour: 130.00,
    monthlyPrice: 460.00,
    badge: "Piso Flutuante",
    bookingsCount: 31,
    orderIndex: 5,
    description: "Ginásio coberto de alta absorção com piso modular esportivo, tabelas hidráulicas móveis de basquete e traves de futsal.",
    observation: "Uso obrigatório de tênis com solado flat (não marcante).",
    specs: {
      type: "Piso Flutuante de Madeira Tratada / Poliuretano",
      capacity: "10 a 20 Jogadores",
      features: ["Marcações Oficiais Futsal/Basquete/Vôlei", "Tabelas Hidráulicas", "Placar Eletrônico", "Vestiários Completos"],
      status: "Disponível"
    }
  },
  {
    id: "court-padel-1",
    name: "Quadra de Padel & Tênis Panorâmica",
    category: "padel",
    categoryLabel: "Padel & Tênis",
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=80",
    basePricePerHour: 110.00,
    monthlyPrice: 400.00,
    badge: "Panorâmica",
    bookingsCount: 22,
    orderIndex: 6,
    description: "Quadra panorâmica moderna com vidro temperado de 12mm e iluminação anti-reflexo.",
    observation: "Raquetes e bolinhas podem ser alugadas à parte.",
    specs: {
      type: "Vidro Temperado Panorâmico + Grama Fina",
      capacity: "4 Jogadores (Duplas)",
      features: ["Vidro 12mm Oficial", "Piso de Alta Performance", "Iluminação LED Especial de Alto Contraste"],
      status: "Disponível"
    }
  }
];

const initialProducts = [
  {
    id: "prod-agua",
    name: "Água Mineral Crystal 500ml (Gelada)",
    category: "Bebidas",
    type: "product",
    price: 4.00,
    unit: "unid.",
    image: "https://images.unsplash.com/photo-1559839914-17aae19cec71?w=200&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-isotonico",
    name: "Gatorade / Isotônico 500ml (Vários Sabores)",
    category: "Bebidas",
    type: "product",
    price: 9.00,
    unit: "unid.",
    image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=200&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-refrigerante",
    name: "Refrigerante Lata 350ml (Coca / Guaraná)",
    category: "Bebidas",
    type: "product",
    price: 6.00,
    unit: "lata",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-cerveja",
    name: "Cerveja Heineken Long Neck 330ml",
    category: "Bebidas",
    type: "product",
    price: 12.00,
    unit: "unid.",
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=200&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-gelo",
    name: "Saco de Gelo Filtrado 5kg",
    category: "Bebidas & Gelo",
    type: "product",
    price: 15.00,
    unit: "saco",
    image: "https://images.unsplash.com/photo-1516715094483-75da7dee9758?w=200&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-espetinho",
    name: "Combo 3 Espetinhos Gourmet na Brasa (Carne / Frango / Queijo)",
    category: "Alimentos",
    type: "product",
    price: 28.00,
    unit: "combo",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-carvao",
    name: "Saco de Carvão Vegetal 3kg + Acendedor",
    category: "Churrasco",
    type: "product",
    price: 22.00,
    unit: "saco",
    image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=200&auto=format&fit=crop&q=80"
  }
];

const initialMonthlyMembers = [
  // SEGUNDA-FEIRA
  {
    id: "arena-fixo-seg-1",
    team_name: "Amigos da Segunda FC",
    responsible_name: "Carlos Eduardo",
    phone: "(81) 98877-1122",
    court_id: "court-society-1",
    day_of_week: "segunda",
    day_of_week_label: "Toda Segunda-feira às 19:00",
    time: "19:00 às 20:00",
    start_time: "19:00",
    end_time: "20:00",
    monthly_price: 560.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-seg-2",
    team_name: "Pelada dos Bancários",
    responsible_name: "Marcos Vinícius",
    phone: "(81) 99123-4567",
    court_id: "court-society-1",
    day_of_week: "segunda",
    day_of_week_label: "Toda Segunda-feira às 20:00",
    time: "20:00 às 21:00",
    start_time: "20:00",
    end_time: "21:00",
    monthly_price: 560.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-seg-3",
    team_name: "Turma do Beach Tennis",
    responsible_name: "Juliana Mendes",
    phone: "(81) 99456-7890",
    court_id: "court-beach-1",
    day_of_week: "segunda",
    day_of_week_label: "Toda Segunda-feira às 18:30",
    time: "18:30 às 19:30",
    start_time: "18:30",
    end_time: "19:30",
    monthly_price: 360.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },

  // TERÇA-FEIRA
  {
    id: "arena-fixo-ter-1",
    team_name: "Galácticos Limoeiro",
    responsible_name: "Roberto Silva",
    phone: "(81) 98765-1234",
    court_id: "court-society-2",
    day_of_week: "terca",
    day_of_week_label: "Toda Terça-feira às 19:00",
    time: "19:00 às 20:30",
    start_time: "19:00",
    end_time: "20:30",
    monthly_price: 640.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-ter-2",
    team_name: "Futsal Veteranos",
    responsible_name: "André Santos",
    phone: "(81) 99888-2233",
    court_id: "court-gym-1",
    day_of_week: "terca",
    day_of_week_label: "Toda Terça-feira às 20:00",
    time: "20:00 às 21:00",
    start_time: "20:00",
    end_time: "21:00",
    monthly_price: 480.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-ter-3",
    team_name: "Duplas Beach Master",
    responsible_name: "Larissa Duarte",
    phone: "(81) 99333-4455",
    court_id: "court-beach-2",
    day_of_week: "terca",
    day_of_week_label: "Toda Terça-feira às 18:00",
    time: "18:00 às 19:00",
    start_time: "18:00",
    end_time: "19:00",
    monthly_price: 360.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },

  // QUARTA-FEIRA
  {
    id: "arena-fixo-qua-1",
    team_name: "Quarta Clássica Society",
    responsible_name: "Felipe Souza",
    phone: "(81) 98111-2233",
    court_id: "court-society-1",
    day_of_week: "quarta",
    day_of_week_label: "Toda Quarta-feira às 19:00",
    time: "19:00 às 20:00",
    start_time: "19:00",
    end_time: "20:00",
    monthly_price: 560.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-qua-2",
    team_name: "Resenha & Futebol",
    responsible_name: "Diego Ramos",
    phone: "(81) 98444-5566",
    court_id: "court-society-2",
    day_of_week: "quarta",
    day_of_week_label: "Toda Quarta-feira às 20:00",
    time: "20:00 às 21:30",
    start_time: "20:00",
    end_time: "21:30",
    monthly_price: 640.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-qua-3",
    team_name: "Padel Club Limoeiro",
    responsible_name: "Thiago Alencar",
    phone: "(81) 99777-8899",
    court_id: "court-padel-1",
    day_of_week: "quarta",
    day_of_week_label: "Toda Quarta-feira às 19:30",
    time: "19:30 às 20:30",
    start_time: "19:30",
    end_time: "20:30",
    monthly_price: 440.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },

  // QUINTA-FEIRA
  {
    id: "arena-fixo-qui-1",
    team_name: "Pelada Quinta Nobre",
    responsible_name: "Rodrigo Oliveira",
    phone: "(81) 98999-0011",
    court_id: "court-society-1",
    day_of_week: "quinta",
    day_of_week_label: "Toda Quinta-feira às 19:00",
    time: "19:00 às 20:00",
    start_time: "19:00",
    end_time: "20:00",
    monthly_price: 560.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-qui-2",
    team_name: "Basquete & Futsal Noite",
    responsible_name: "Gabriel Lima",
    phone: "(81) 99222-3344",
    court_id: "court-gym-1",
    day_of_week: "quinta",
    day_of_week_label: "Toda Quinta-feira às 20:00",
    time: "20:00 às 21:00",
    start_time: "20:00",
    end_time: "21:00",
    monthly_price: 480.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-qui-3",
    team_name: "Futevôlei das Quintas",
    responsible_name: "Lucas Martins",
    phone: "(81) 99666-7788",
    court_id: "court-beach-1",
    day_of_week: "quinta",
    day_of_week_label: "Toda Quinta-feira às 18:30",
    time: "18:30 às 19:30",
    start_time: "18:30",
    end_time: "19:30",
    monthly_price: 360.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },

  // SEXTA-FEIRA
  {
    id: "arena-fixo-sex-1",
    team_name: "Sextou Futebol Clube",
    responsible_name: "Marcelo Farias",
    phone: "(81) 98555-6677",
    court_id: "court-society-1",
    day_of_week: "sexta",
    day_of_week_label: "Toda Sexta-feira às 18:30",
    time: "18:30 às 19:30",
    start_time: "18:30",
    end_time: "19:30",
    monthly_price: 560.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-sex-2",
    team_name: "Churrasco & Bola Society",
    responsible_name: "Bruno Henrique",
    phone: "(81) 99111-9922",
    court_id: "court-society-2",
    day_of_week: "sexta",
    day_of_week_label: "Toda Sexta-feira às 19:30",
    time: "19:30 às 21:00",
    start_time: "19:30",
    end_time: "21:00",
    monthly_price: 640.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-sex-3",
    team_name: "Beach Tennis Happy Hour",
    responsible_name: "Camila Castro",
    phone: "(81) 99444-1122",
    court_id: "court-beach-1",
    day_of_week: "sexta",
    day_of_week_label: "Toda Sexta-feira às 19:00",
    time: "19:00 às 20:00",
    start_time: "19:00",
    end_time: "20:00",
    monthly_price: 360.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },

  // SÁBADO
  {
    id: "arena-fixo-sab-1",
    team_name: "Rachão Matinal Sábado",
    responsible_name: "Fernando Costa",
    phone: "(81) 98777-3344",
    court_id: "court-society-1",
    day_of_week: "sabado",
    day_of_week_label: "Todo Sábado às 07:30",
    time: "07:30 às 09:00",
    start_time: "07:30",
    end_time: "09:00",
    monthly_price: 560.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-sab-2",
    team_name: "Escolinha Craques do Futuro",
    responsible_name: "Prof. Renato",
    phone: "(81) 99888-5566",
    court_id: "court-society-1",
    day_of_week: "sabado",
    day_of_week_label: "Todo Sábado às 09:00",
    time: "09:00 às 10:30",
    start_time: "09:00",
    end_time: "10:30",
    monthly_price: 560.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-sab-3",
    team_name: "Torneio Society Tarde",
    responsible_name: "Leonardo Dias",
    phone: "(81) 98222-7788",
    court_id: "court-society-2",
    day_of_week: "sabado",
    day_of_week_label: "Todo Sábado às 15:30",
    time: "15:30 às 17:00",
    start_time: "15:30",
    end_time: "17:00",
    monthly_price: 640.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-sab-4",
    team_name: "Manhã do Beach Tennis",
    responsible_name: "Beatriz Rocha",
    phone: "(81) 99555-8899",
    court_id: "court-beach-1",
    day_of_week: "sabado",
    day_of_week_label: "Todo Sábado às 08:00",
    time: "08:00 às 09:30",
    start_time: "08:00",
    end_time: "09:30",
    monthly_price: 360.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },

  // DOMINGO
  {
    id: "arena-fixo-dom-1",
    team_name: "Pelada Domingo Tradicional",
    responsible_name: "José Carlos",
    phone: "(81) 98666-4455",
    court_id: "court-society-1",
    day_of_week: "domingo",
    day_of_week_label: "Todo Domingo às 07:30",
    time: "07:30 às 09:00",
    start_time: "07:30",
    end_time: "09:00",
    monthly_price: 560.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-dom-2",
    team_name: "Família & Amigos Society",
    responsible_name: "Wagner Moura",
    phone: "(81) 99333-8811",
    court_id: "court-society-1",
    day_of_week: "domingo",
    day_of_week_label: "Todo Domingo às 09:00",
    time: "09:00 às 10:30",
    start_time: "09:00",
    end_time: "10:30",
    monthly_price: 560.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  },
  {
    id: "arena-fixo-dom-3",
    team_name: "Vôlei de Praia Domingo",
    responsible_name: "Patrícia Gomes",
    phone: "(81) 99777-4422",
    court_id: "court-beach-2",
    day_of_week: "domingo",
    day_of_week_label: "Todo Domingo às 08:00",
    time: "08:00 às 09:30",
    start_time: "08:00",
    end_time: "09:30",
    monthly_price: 360.00,
    status: "active",
    observation: "Horário Fixo Semanal Oficial"
  }
];

const initialBookings = [];
const allBookings = [];

const coupons = {
  "LIMOEIRO10": { discountPercent: 10, description: "10% de desconto na Arena Limoeiro" },
  "PRIMEIRA": { discountPercent: 15, description: "15% de desconto de boas-vindas" },
  "MENSALISTA": { discountPercent: 12, description: "12% de desconto no plano mensal" }
};

window.ARENA_DEFAULT_DATA = {
  arenaInfo,
  categories,
  initialCourts,
  initialProducts,
  initialMonthlyMembers,
  initialAdmins,
  coupons,
  initialBookings,
  allBookings
};
