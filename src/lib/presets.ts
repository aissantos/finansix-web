/**
 * Presets de serviços populares para facilitar cadastro rápido
 * Valores em BRL atualizados para Janeiro/2026
 */

// ============================================================================
// ASSINATURAS POPULARES
// ============================================================================

export interface SubscriptionPreset {
  name: string;
  icon: string;
  defaultAmount: number;
  category: string;
  color?: string;
}

export const SUBSCRIPTION_PRESETS: Record<string, SubscriptionPreset[]> = {
  streaming: [
    { name: 'Netflix', icon: '🎬', defaultAmount: 59.90, category: 'streaming', color: '#E50914' },
    { name: 'Amazon Prime', icon: '📦', defaultAmount: 19.90, category: 'streaming', color: '#00A8E1' },
    { name: 'Disney+', icon: '🏰', defaultAmount: 43.90, category: 'streaming', color: '#113CCF' },
    { name: 'HBO Max', icon: '🎭', defaultAmount: 34.90, category: 'streaming', color: '#5822B4' },
    { name: 'Paramount+', icon: '⭐', defaultAmount: 19.90, category: 'streaming', color: '#0064FF' },
    { name: 'Globoplay', icon: '🌐', defaultAmount: 24.90, category: 'streaming', color: '#F72E2F' },
    { name: 'Star+', icon: '✨', defaultAmount: 32.90, category: 'streaming', color: '#02C8C8' },
    { name: 'Apple TV+', icon: '🍎', defaultAmount: 21.90, category: 'streaming', color: '#000000' },
    { name: 'Crunchyroll', icon: '🎌', defaultAmount: 25.00, category: 'streaming', color: '#F47521' },
  ],
  music: [
    { name: 'Spotify', icon: '🎵', defaultAmount: 21.90, category: 'music', color: '#1DB954' },
    { name: 'Apple Music', icon: '🎧', defaultAmount: 21.90, category: 'music', color: '#FC3C44' },
    { name: 'YouTube Music', icon: '▶️', defaultAmount: 24.90, category: 'music', color: '#FF0000' },
    { name: 'Deezer', icon: '🎶', defaultAmount: 19.90, category: 'music', color: '#FEAA2D' },
    { name: 'Amazon Music', icon: '🎼', defaultAmount: 19.90, category: 'music', color: '#00A8E1' },
    { name: 'Tidal', icon: '🌊', defaultAmount: 24.90, category: 'music', color: '#000000' },
  ],
  ai: [
    { name: 'ChatGPT Plus', icon: '🤖', defaultAmount: 104.90, category: 'ai', color: '#10A37F' },
    { name: 'Claude Pro', icon: '🧠', defaultAmount: 104.90, category: 'ai', color: '#D97757' },
    { name: 'Gemini Advanced', icon: '✦', defaultAmount: 96.99, category: 'ai', color: '#4285F4' },
    { name: 'Copilot Pro', icon: '💡', defaultAmount: 104.90, category: 'ai', color: '#0078D4' },
    { name: 'Midjourney', icon: '🎨', defaultAmount: 52.00, category: 'ai', color: '#000000' },
    { name: 'Perplexity Pro', icon: '🔍', defaultAmount: 104.90, category: 'ai', color: '#1FB8CD' },
    { name: 'Notion AI', icon: '📝', defaultAmount: 52.00, category: 'ai', color: '#000000' },
  ],
  gaming: [
    { name: 'Xbox Game Pass', icon: '🎮', defaultAmount: 44.99, category: 'gaming', color: '#107C10' },
    { name: 'PlayStation Plus', icon: '🕹️', defaultAmount: 47.90, category: 'gaming', color: '#003791' },
    { name: 'Nintendo Online', icon: '🍄', defaultAmount: 20.00, category: 'gaming', color: '#E60012' },
    { name: 'EA Play', icon: '⚽', defaultAmount: 24.90, category: 'gaming', color: '#000000' },
    { name: 'GeForce Now', icon: '💚', defaultAmount: 54.99, category: 'gaming', color: '#76B900' },
  ],
  cloud: [
    { name: 'iCloud+', icon: '☁️', defaultAmount: 3.50, category: 'cloud', color: '#3693F3' },
    { name: 'Google One', icon: '🔵', defaultAmount: 6.99, category: 'cloud', color: '#4285F4' },
    { name: 'OneDrive', icon: '📁', defaultAmount: 9.00, category: 'cloud', color: '#0078D4' },
    { name: 'Dropbox Plus', icon: '📂', defaultAmount: 59.90, category: 'cloud', color: '#0061FF' },
  ],
  productivity: [
    { name: 'Microsoft 365', icon: '📊', defaultAmount: 45.00, category: 'productivity', color: '#D83B01' },
    { name: 'Notion', icon: '📓', defaultAmount: 48.00, category: 'productivity', color: '#000000' },
    { name: 'Canva Pro', icon: '🎨', defaultAmount: 54.99, category: 'productivity', color: '#00C4CC' },
    { name: 'Adobe Creative', icon: '🅰️', defaultAmount: 290.00, category: 'productivity', color: '#FF0000' },
    { name: 'Figma', icon: '✏️', defaultAmount: 75.00, category: 'productivity', color: '#F24E1E' },
    { name: 'Slack', icon: '💬', defaultAmount: 44.25, category: 'productivity', color: '#4A154B' },
    { name: 'Zoom', icon: '📹', defaultAmount: 92.90, category: 'productivity', color: '#2D8CFF' },
  ],
  fitness: [
    { name: 'Smart Fit', icon: '💪', defaultAmount: 119.90, category: 'fitness', color: '#FF6600' },
    { name: 'Gympass', icon: '🏋️', defaultAmount: 129.90, category: 'fitness', color: '#E11D48' },
    { name: 'TotalPass', icon: '🎯', defaultAmount: 109.90, category: 'fitness', color: '#00B4D8' },
    { name: 'Strava', icon: '🚴', defaultAmount: 35.99, category: 'fitness', color: '#FC4C02' },
    { name: 'Nike Training', icon: '✔️', defaultAmount: 39.90, category: 'fitness', color: '#000000' },
  ],
  education: [
    { name: 'Duolingo Plus', icon: '🦉', defaultAmount: 49.90, category: 'education', color: '#58CC02' },
    { name: 'Coursera Plus', icon: '📚', defaultAmount: 240.00, category: 'education', color: '#0056D2' },
    { name: 'Udemy Business', icon: '🎓', defaultAmount: 59.90, category: 'education', color: '#A435F0' },
    { name: 'Alura', icon: '🖥️', defaultAmount: 99.00, category: 'education', color: '#0088CC' },
    { name: 'LinkedIn Learning', icon: '💼', defaultAmount: 119.99, category: 'education', color: '#0A66C2' },
  ],
  news: [
    { name: 'The New York Times', icon: '📰', defaultAmount: 60.00, category: 'news', color: '#000000' },
    { name: 'Estadão', icon: '📄', defaultAmount: 29.90, category: 'news', color: '#003E7E' },
    { name: 'Folha de S. Paulo', icon: '📃', defaultAmount: 29.90, category: 'news', color: '#E42313' },
    { name: 'O Globo', icon: '🌍', defaultAmount: 24.90, category: 'news', color: '#0080C8' },
    { name: 'UOL', icon: '🟠', defaultAmount: 19.90, category: 'news', color: '#FF6600' },
  ],
  delivery: [
    { name: 'iFood Club', icon: '🍔', defaultAmount: 24.90, category: 'delivery', color: '#EA1D2C' },
    { name: 'Rappi Prime', icon: '🛵', defaultAmount: 29.90, category: 'delivery', color: '#FF441F' },
    { name: 'Uber One', icon: '🚗', defaultAmount: 24.90, category: 'delivery', color: '#000000' },
    { name: '99Food', icon: '🍕', defaultAmount: 19.90, category: 'delivery', color: '#FFCB00' },
  ],
  security: [
    { name: 'NordVPN', icon: '🔒', defaultAmount: 18.00, category: 'security', color: '#4687FF' },
    { name: 'ExpressVPN', icon: '🛡️', defaultAmount: 51.00, category: 'security', color: '#DA3940' },
    { name: '1Password', icon: '🔑', defaultAmount: 18.00, category: 'security', color: '#0094F5' },
    { name: 'LastPass', icon: '🔐', defaultAmount: 17.00, category: 'security', color: '#D32D27' },
  ],
};

export const SUBSCRIPTION_CATEGORIES = [
  { id: 'streaming', name: 'Streaming', icon: '🎬' },
  { id: 'music', name: 'Música', icon: '🎵' },
  { id: 'ai', name: 'Inteligência Artificial', icon: '🤖' },
  { id: 'gaming', name: 'Jogos', icon: '🎮' },
  { id: 'cloud', name: 'Armazenamento', icon: '☁️' },
  { id: 'productivity', name: 'Produtividade', icon: '💼' },
  { id: 'fitness', name: 'Fitness', icon: '💪' },
  { id: 'education', name: 'Educação', icon: '📚' },
  { id: 'news', name: 'Notícias', icon: '📰' },
  { id: 'delivery', name: 'Delivery', icon: '🍔' },
  { id: 'security', name: 'Segurança', icon: '🔒' },
];

// ============================================================================
// BANCOS BRASILEIROS
// ============================================================================

export interface BankPreset {
  id: string;
  name: string;
  color: string;
  icon?: string;
  type: 'digital' | 'traditional' | 'investment';
  bankCode?: string; // Código BACEN/COMPE
}

export const BANK_PRESETS: BankPreset[] = [
  // Bancos Digitais
  { id: 'nubank', name: 'Nubank', color: '#820AD1', type: 'digital', bankCode: '260' },
  { id: 'inter', name: 'Inter', color: '#FF7A00', type: 'digital', bankCode: '077' },
  { id: 'c6', name: 'C6 Bank', color: '#242424', type: 'digital', bankCode: '336' },
  { id: 'next', name: 'Next', color: '#00E676', type: 'digital', bankCode: '237' },
  { id: 'neon', name: 'Neon', color: '#00E5FF', type: 'digital', bankCode: '735' },
  { id: 'picpay', name: 'PicPay', color: '#21C25E', type: 'digital', bankCode: '380' },
  { id: 'pagbank', name: 'PagBank', color: '#00B140', type: 'digital', bankCode: '290' },
  { id: 'original', name: 'Banco Original', color: '#00A651', type: 'digital', bankCode: '212' },
  { id: 'will', name: 'Will Bank', color: '#FFDD00', type: 'digital', bankCode: '280' },
  { id: 'iti', name: 'iti Itaú', color: '#EC7000', type: 'digital', bankCode: '341' },
  
  // Bancos Tradicionais
  { id: 'bb', name: 'Banco do Brasil', color: '#FFCC00', type: 'traditional', bankCode: '001' },
  { id: 'caixa', name: 'Caixa Econômica', color: '#005CA9', type: 'traditional', bankCode: '104' },
  { id: 'itau', name: 'Itaú', color: '#EC7000', type: 'traditional', bankCode: '341' },
  { id: 'bradesco', name: 'Bradesco', color: '#CC092F', type: 'traditional', bankCode: '237' },
  { id: 'santander', name: 'Santander', color: '#EC0000', type: 'traditional', bankCode: '033' },
  { id: 'btg', name: 'BTG Pactual', color: '#001E62', type: 'traditional', bankCode: '208' },
  { id: 'safra', name: 'Safra', color: '#004B87', type: 'traditional', bankCode: '422' },
  { id: 'sicredi', name: 'Sicredi', color: '#00A651', type: 'traditional', bankCode: '748' },
  { id: 'sicoob', name: 'Sicoob', color: '#003366', type: 'traditional', bankCode: '756' },
  { id: 'banrisul', name: 'Banrisul', color: '#004B87', type: 'traditional', bankCode: '041' },
  
  // Corretoras/Investimentos
  { id: 'xp', name: 'XP Investimentos', color: '#000000', type: 'investment', bankCode: '102' },
  { id: 'rico', name: 'Rico', color: '#FF5500', type: 'investment', bankCode: '102' },
  { id: 'clear', name: 'Clear', color: '#00AEEF', type: 'investment', bankCode: '102' },
  { id: 'modal', name: 'Modal', color: '#00263E', type: 'investment', bankCode: '746' },
  { id: 'genial', name: 'Genial', color: '#FFB800', type: 'investment', bankCode: '125' },
  { id: 'avenue', name: 'Avenue', color: '#5B00FF', type: 'investment' },
  { id: 'nomad', name: 'Nomad', color: '#9747FF', type: 'investment' },
];

// ============================================================================
// BANDEIRAS DE CARTÃO
// ============================================================================

export interface CardBrandPreset {
  id: string;
  name: string;
  color: string;
  logo?: string;
}

export const CARD_BRAND_PRESETS: CardBrandPreset[] = [
  { id: 'visa', name: 'Visa', color: '#1A1F71' },
  { id: 'mastercard', name: 'Mastercard', color: '#EB001B' },
  { id: 'elo', name: 'Elo', color: '#FFCB05' },
  { id: 'amex', name: 'American Express', color: '#006FCF' },
  { id: 'hipercard', name: 'Hipercard', color: '#B3131B' },
  { id: 'diners', name: 'Diners Club', color: '#004B93' },
  { id: 'discover', name: 'Discover', color: '#FF6000' },
  { id: 'jcb', name: 'JCB', color: '#0B4EA2' },
];

// ============================================================================
// CORES POPULARES DE CARTÕES POR BANCO
// ============================================================================

export const CARD_COLORS_BY_BANK: Record<string, string[]> = {
  nubank: ['#820AD1', '#5A0D96', '#9B30FF'],
  inter: ['#FF7A00', '#000000', '#FF9933'],
  c6: ['#242424', '#1A1A1A', '#333333'],
  itau: ['#EC7000', '#003366', '#FF8C00'],
  bradesco: ['#CC092F', '#8B0000', '#FF1744'],
  santander: ['#EC0000', '#CC0000', '#FF0000'],
  bb: ['#FFCC00', '#003366', '#FFD700'],
  caixa: ['#005CA9', '#003366', '#0077CC'],
  default: [
    '#820AD1', // Nubank purple
    '#1A1F71', // Visa blue
    '#EB001B', // Red
    '#00A4E0', // Cyan
    '#6366F1', // Indigo
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#1E293B', // Slate dark
    '#0EA5E9', // Sky
  ],
};

// ============================================================================
// HELPERS
// ============================================================================

export function getAllSubscriptionPresets(): SubscriptionPreset[] {
  return Object.values(SUBSCRIPTION_PRESETS).flat();
}

export function searchSubscriptions(query: string): SubscriptionPreset[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];
  
  return getAllSubscriptionPresets().filter(
    (s) => s.name.toLowerCase().includes(normalizedQuery)
  );
}

export function searchBanks(query: string): BankPreset[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return BANK_PRESETS;
  
  return BANK_PRESETS.filter(
    (b) => b.name.toLowerCase().includes(normalizedQuery)
  );
}

export function getBanksByType(type: BankPreset['type']): BankPreset[] {
  return BANK_PRESETS.filter((b) => b.type === type);
}
