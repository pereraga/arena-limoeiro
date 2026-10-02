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
    password: "Alves@157620",
    role: "Administrador Geral",
    permissions: [
      "can_delete_bookings",
      "can_start_matches",
      "can_finish_matches",
      "can_direct_booking",
      "can_manage_bar",
      "can_manage_products",
      "can_edit_courts",
      "can_manage_maintenance",
      "can_manage_categories",
      "can_manage_customers",
      "can_manage_monthly",
      "can_manage_settings"
    ],
    createdAt: "01/09/2026"
  },
  {
    id: "admin-1788989952703",
    name: "Vinicius Melo",
    email: "vinicius.melo@arenalimoeiro.com.br",
    password: "vinicius@2026!",
    role: "Gerente do Sistema",
    permissions: [
      "can_delete_bookings",
      "can_start_matches",
      "can_finish_matches",
      "can_direct_booking",
      "can_manage_bar",
      "can_manage_products",
      "can_edit_courts",
      "can_manage_maintenance",
      "can_manage_categories",
      "can_manage_customers",
      "can_manage_monthly"
    ],
    createdAt: "09/09/2026"
  }
];

const categories = [
  { id: "all", name: "Todos os Espaços", icon: "layout-grid" },
  { id: "poliesportiva", name: "Quadra Poliesportiva", icon: "trophy" },
  { id: "beach", name: "Arena Beach", icon: "sun" },
  { id: "society", name: "Society", icon: "activity" },
  { id: "foot-skill", name: "Foot-Skill", icon: "target" }
];

const initialCourts = [
  {
    id: "court-society-1",
    name: "FUT 5 - SOCCER 5",
    category: "poliesportiva",
    categoryLabel: "Quadra Poliesportiva",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80",
    basePricePerHour: 90.00,
    monthlyPrice: 500.00,
    badge: "🔥 Mais Agendada da Semana",
    bookingsCount: 48,
    orderIndex: 1,
    description: "Espaço projetado para jogos ágeis e de muita movimentação. Com dimensões otimizadas para o futebol rápido, possui amortecimento e excelente absorção de impacto.",
    observation: "Permitido apenas chuteiras society ou tênis (proibido travas de campo).",
    specs: {
      type: "Grama Sintética 60mm",
      surface: "Grama Sintética 60mm",
      capacity: "10 a 12 Jogadores",
      features: ["Iluminação LED", "Vestiários", "Churrasqueira Anexa"],
      status: "Disponível",
      opening_time: "06:00",
      closing_time: "23:00",
      discount_price_per_hour: 60.00,
      discount_start_time: "09:00",
      discount_end_time: "16:00",
      gallery: [
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80"
      ]
    },
    discountPricePerHour: 60.00,
    discount_price_per_hour: 60.00,
    discountStartTime: "09:00",
    discountEndTime: "16:00"
  },
  {
    id: "court-society-2",
    name: "FUT 6 - SOCCER 6",
    category: "poliesportiva",
    categoryLabel: "Quadra Poliesportiva",
    image: "https://images.unsplash.com/photo-1529900245534-47fbf8204bca?w=800&auto=format&fit=crop&q=80",
    basePricePerHour: 100.00,
    monthlyPrice: 600.00,
    badge: "⭐ Preferida da Galera",
    bookingsCount: 42,
    orderIndex: 2,
    description: "O meio-termo ideal entre o jogo rápido de salão e o campo tradicional. Com gramado sintético de alta durabilidade e iluminação potente para partidas noturnas.",
    observation: "Permitido apenas chuteiras society ou tênis (proibido travas de campo).",
    specs: {
      type: "Grama Sintética 60mm",
      surface: "Grama Sintética 60mm",
      capacity: "12 a 14 Jogadores",
      features: ["Iluminação LED", "Vestiários", "100% Coberto"],
      status: "Disponível",
      opening_time: "06:00",
      closing_time: "23:00",
      discount_price_per_hour: 60.00,
      discount_start_time: "09:00",
      discount_end_time: "16:00",
      gallery: [
        "https://images.unsplash.com/photo-1529900245534-47fbf8204bca?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&auto=format&fit=crop&q=80"
      ]
    },
    discountPricePerHour: 60.00,
    discount_price_per_hour: 60.00,
    discountStartTime: "09:00",
    discountEndTime: "16:00"
  },
  {
    id: "court-beach-1",
    name: "FUT 7 - SOCCER 7",
    category: "poliesportiva",
    categoryLabel: "Quadra Poliesportiva",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80",
    basePricePerHour: 110.00,
    monthlyPrice: 650.00,
    badge: "🔥 Mais Agendada da Semana",
    bookingsCount: 39,
    orderIndex: 3,
    description: "Estrutura padrão de futebol society com dimensões oficiais e grama sintética de alto rendimento. Perfeita para campeonatos, torneios e partidas com amigos.",
    observation: "Permitido apenas chuteiras society ou tênis (proibido travas de campo).",
    specs: {
      type: "Grama Sintética 60mm",
      surface: "Grama Sintética 60mm",
      capacity: "14 a 20 Jogadores",
      features: ["Iluminação LED", "Vestiários", "Placar Digital"],
      status: "Disponível",
      opening_time: "06:00",
      closing_time: "23:00",
      discount_price_per_hour: 90.00,
      discount_start_time: "09:00",
      discount_end_time: "16:00",
      gallery: [
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80"
      ]
    },
    discountPricePerHour: 90.00,
    discount_price_per_hour: 90.00,
    discountStartTime: "09:00",
    discountEndTime: "16:00"
  },
  {
    id: "court-esportes-de-quadra-1788962671043",
    name: "FOOT TABLE - FUTMESA",
    category: "foot-skill",
    categoryLabel: "Foot-Skill",
    image: "https://images.unsplash.com/photo-1518604666864-7423958f7660?w=800&auto=format&fit=crop&q=80",
    basePricePerHour: 35.00,
    monthlyPrice: 200.00,
    badge: "🎯 Melhor Custo-Benefício",
    bookingsCount: 48,
    orderIndex: 4,
    description: "Área dedicada à prática de futmesa com piso nivelado e mesa de alta qualidade com curvatura padrão oficial para treinos de técnica e disputas dinâmicas.",
    observation: "Uso com tênis apropriado ou descalço na área da mesa.",
    specs: {
      type: "Grama Sintética 60mm",
      surface: "Grama Sintética 60mm",
      capacity: "10 a 14 Jogadores",
      features: ["Mesa Oficial", "Iluminação LED", "Vestiários"],
      status: "Disponível",
      opening_time: "06:00",
      closing_time: "23:00",
      discount_price_per_hour: 25.00,
      discount_start_time: "09:00",
      discount_end_time: "16:00",
      gallery: [
        "https://images.unsplash.com/photo-1518604666864-7423958f7660?w=800&auto=format&fit=crop&q=80"
      ]
    },
    discountPricePerHour: 25.00,
    discount_price_per_hour: 25.00,
    discountStartTime: "09:00",
    discountEndTime: "16:00"
  },
  {
    id: "court-beach-2",
    name: "QUADRA DE AREIA - SAND COURT",
    category: "beach",
    categoryLabel: "Arena Beach",
    image: "https://images.unsplash.com/photo-1592656094267-764a45160876?w=800&auto=format&fit=crop&q=80",
    basePricePerHour: 50.00,
    monthlyPrice: 320.00,
    badge: "🏖️ Areia Fina Tratada",
    bookingsCount: 26,
    orderIndex: 5,
    description: "Quadra de areia nivelada e higienizada, projetada para absorção de impacto e máximo esforço físico sem sobrecarga articular. Ideal para futevôlei e beach tennis.",
    observation: "Duchas ao lado disponíveis. Aluguel de bolas e raquetes na recepção.",
    specs: {
      type: "Areia Branca",
      surface: "Areia Branca",
      capacity: "4 a 8 Jogadores",
      features: ["Areia Lavada", "Refletores LED", "Duchas Anexas"],
      status: "Disponível",
      opening_time: "06:00",
      closing_time: "23:00",
      discount_price_per_hour: 30.00,
      discount_start_time: "09:00",
      discount_end_time: "16:00",
      gallery: [
        "https://images.unsplash.com/photo-1592656094267-764a45160876?w=800&auto=format&fit=crop&q=80"
      ]
    },
    discountPricePerHour: 30.00,
    discount_price_per_hour: 30.00,
    discountStartTime: "09:00",
    discountEndTime: "16:00"
  },
  {
    id: "court-futsal-1788963178368",
    name: "QUADRA SOCIETY",
    category: "society",
    categoryLabel: "Society",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80",
    basePricePerHour: 60.00,
    monthlyPrice: 400.00,
    badge: "⚡ Alta Procura",
    bookingsCount: 49,
    orderIndex: 6,
    description: "Quadra poliesportiva em piso de cimento polido, ideal para jogos rápidos e com alto controle de bola. Espaço versátil com marcações esportivas atualizadas.",
    observation: "Obrigatório o uso de tênis esportivo ou de futsal. Proibido travas.",
    specs: {
      type: "Cimento Polido",
      surface: "Cimento Polido",
      capacity: "10 a 14 Jogadores",
      features: ["Piso Polido", "Iluminação LED", "Vestiários"],
      status: "Disponível",
      opening_time: "06:00",
      closing_time: "23:00",
      discount_price_per_hour: 40.00,
      discount_start_time: "09:00",
      discount_end_time: "16:00",
      gallery: [
        "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80"
      ]
    },
    discountPricePerHour: 40.00,
    discount_price_per_hour: 40.00,
    discountStartTime: "09:00",
    discountEndTime: "16:00"
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

const initialMonthlyMembers = [];

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
