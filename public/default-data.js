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
    name: "Administrador Geral",
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
    role: "Atendente da Recepção",
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
    sampleMensalistas: [
      "Pelada dos Amigos (Terça 19h)",
      "Galera da Firma (Quarta 20h)",
      "Futebol & Resenha (Sexta 19h)"
    ],
    specs: {
      type: "Grama Sintética 60mm Monofilamento (FIFA Quality)",
      capacity: "14 a 16 Jogadores (7x7 / 8x8)",
      features: ["Iluminação LED 800W Pro", "Placar Eletrônico Digital", "Vestiários com Ducha Quente", "Churrasqueira Anexa"],
      status: "Disponível"
    }
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
    sampleMensalistas: [
      "Pelada Noturna (Segunda 20h)",
      "Amigos do Society (Quinta 19h)"
    ],
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
    sampleMensalistas: [
      "Beach Club Limoeiro (Segunda e Quarta 18h)",
      "Galera do Futevôlei (Sábado 08h)"
    ],
    specs: {
      type: "Areia Especial Tratada e Filtrada (Não queima o pé)",
      capacity: "4 a 8 Jogadores",
      features: ["Rede Oficial Regulável", "Iluminação Noturna sem Ofuscamento", "Duchas ao Lado", "Kiosk Bar Próximo"],
      status: "Disponível"
    }
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
    sampleMensalistas: [
      "Turma do Vôlei de Areia (Domingo 09h)"
    ],
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
    sampleMensalistas: [
      "Galera do Futsal Noturno (Quinta 20h)",
      "Basquete Limoeiro Team (Sábado 16h)"
    ],
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
    sampleMensalistas: [
      "Dupla de Padel Master (Terça e Quinta 07h)"
    ],
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
  {
    id: "mensal-1",
    teamName: "Pelada dos Amigos da Terça",
    responsibleName: "Carlos Eduardo",
    phone: "(81) 99876-1122",
    courtId: "court-society-1",
    dayOfWeek: "terca",
    dayOfWeekLabel: "Toda Terça-feira",
    time: "19:00",
    monthlyPrice: 500.00,
    status: "active",
    startMonth: "Setembro/2026"
  },
  {
    id: "mensal-2",
    teamName: "Galera do Futsal Noturno",
    responsibleName: "Matheus Silveira",
    phone: "(81) 98844-5566",
    courtId: "court-gym-1",
    dayOfWeek: "quinta",
    dayOfWeekLabel: "Toda Quinta-feira",
    time: "20:00",
    monthlyPrice: 460.00,
    status: "active",
    startMonth: "Setembro/2026"
  }
];

const initialBookings = [
  {
    id: "book-101",
    courtId: "court-society-1",
    date: "2026-09-01",
    startTime: "19:00",
    endTime: "20:00",
    time: "19:00 às 20:00",
    duration: 60,
    customerName: "Carlos Eduardo (Mensalista Terça)",
    customerPhone: "(81) 99876-1122",
    status: "confirmed",
    bookingType: "mensalista",
    totalPrice: 140.00,
    observation: "Horário fixo semanal"
  }
];

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
  allBookings
};
