import { Stock, Timeframe, PricePoint } from '../types';

// Helper to generate realistic historical curves based on an end price, volatility, and trend
function generateHistory(basePrice: number, volatility: number, trend: number): Record<Timeframe, PricePoint[]> {
  const timeframes: Timeframe[] = ['1T', '1W', '1M', '1J', '5J'];
  const result: Partial<Record<Timeframe, PricePoint[]>> = {};

  // 1 Day (Intraday: 9:00 to 17:30, 26 intervals of 20 min)
  const oneDayPoints: PricePoint[] = [];
  const hours = ['09:00', '09:20', '09:40', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
  let currentP = basePrice * (1 - (trend * 0.015) + (Math.random() - 0.5) * 0.01);
  hours.forEach((h, idx) => {
    const stepTrend = (trend * 0.015) / hours.length;
    const randomDelta = (Math.sin(idx * 0.7) + (Math.random() - 0.48)) * (volatility * 0.006 * basePrice);
    currentP = Math.max(1, currentP + stepTrend * basePrice + randomDelta);
    oneDayPoints.push({
      time: h,
      price: Number(currentP.toFixed(2)),
      volume: Math.floor(10000 + Math.random() * 85000)
    });
  });
  // Ensure last point matches close to current price
  oneDayPoints[oneDayPoints.length - 1].price = basePrice;
  result['1T'] = oneDayPoints;

  // 1 Week (7 days)
  const oneWeekPoints: PricePoint[] = [];
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'Heute'];
  let weekP = basePrice * (1 - (trend * 0.04));
  days.forEach((d, idx) => {
    const delta = (trend * 0.04 / 7) * basePrice + (Math.random() - 0.47) * (volatility * 0.015 * basePrice);
    weekP = Math.max(1, weekP + delta);
    oneWeekPoints.push({
      time: d,
      price: idx === days.length - 1 ? basePrice : Number(weekP.toFixed(2)),
      volume: Math.floor(50000 + Math.random() * 250000)
    });
  });
  result['1W'] = oneWeekPoints;

  // 1 Month (30 days sampled every 2 days)
  const oneMonthPoints: PricePoint[] = [];
  let monthP = basePrice * (1 - (trend * 0.08));
  for (let i = 15; i >= 0; i--) {
    const delta = (trend * 0.08 / 16) * basePrice + (Math.random() - 0.46) * (volatility * 0.02 * basePrice);
    monthP = Math.max(1, monthP + delta);
    const dayAgo = i === 0 ? 'Heute' : `vor ${i * 2}T`;
    oneMonthPoints.push({
      time: dayAgo,
      price: i === 0 ? basePrice : Number(monthP.toFixed(2)),
      volume: Math.floor(100000 + Math.random() * 500000)
    });
  }
  result['1M'] = oneMonthPoints;

  // 1 Year (12 months)
  const oneYearPoints: PricePoint[] = [];
  const months = ['Okt', 'Nov', 'Dez', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Aktuell'];
  let yearP = basePrice * (1 - (trend * 0.22));
  months.forEach((m, idx) => {
    const delta = (trend * 0.22 / 12) * basePrice + (Math.random() - 0.45) * (volatility * 0.04 * basePrice);
    yearP = Math.max(1, yearP + delta);
    oneYearPoints.push({
      time: m,
      price: idx === months.length - 1 ? basePrice : Number(yearP.toFixed(2)),
      volume: Math.floor(300000 + Math.random() * 1200000)
    });
  });
  result['1J'] = oneYearPoints;

  // 5 Years (5 annual markers with quarters)
  const fiveYearPoints: PricePoint[] = [];
  const years = ['2021', '2022 Q2', '2023', '2023 Q3', '2024', '2024 Q3', '2025', '2025 Q3', '2026', 'Aktuell'];
  let multiYearP = basePrice * 0.45;
  years.forEach((y, idx) => {
    const progress = (idx + 1) / years.length;
    multiYearP = basePrice * (0.45 + 0.55 * Math.pow(progress, 1.2)) + (Math.random() - 0.5) * (volatility * 0.08 * basePrice);
    fiveYearPoints.push({
      time: y,
      price: idx === years.length - 1 ? basePrice : Number(multiYearP.toFixed(2)),
      volume: Math.floor(500000 + Math.random() * 2000000)
    });
  });
  result['5J'] = fiveYearPoints;

  return result as Record<Timeframe, PricePoint[]>;
}

export const INITIAL_STOCKS: Stock[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Halbleiter & KI',
    category: 'Tech',
    price: 132.80,
    previousClose: 129.40,
    openPrice: 130.20,
    dayHigh: 134.10,
    dayLow: 129.80,
    change: 3.40,
    changePercent: 2.63,
    volume: '54,2 Mio.',
    marketCap: '3,25 Bio. €',
    peRatio: 48.6,
    dividendYield: 0.03,
    fiftyTwoWeekHigh: 140.76,
    fiftyTwoWeekLow: 75.60,
    description: 'Weltweit führender Entwickler von Hochleistungs-Grafikprozessoren (GPUs) und KI-Rechenzentren-Beschleunigern.',
    history: generateHistory(132.80, 2.4, 1.8)
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Verbraucherelektronik',
    category: 'Tech',
    price: 228.40,
    previousClose: 226.90,
    openPrice: 227.10,
    dayHigh: 229.50,
    dayLow: 226.50,
    change: 1.50,
    changePercent: 0.66,
    volume: '42,8 Mio.',
    marketCap: '3,48 Bio. €',
    peRatio: 33.8,
    dividendYield: 0.44,
    fiftyTwoWeekHigh: 237.23,
    fiftyTwoWeekLow: 164.08,
    description: 'Technologiegigant bekannt für iPhone, Mac, iPad, Dienstleistungen und integrierte Software-Ökosysteme.',
    history: generateHistory(228.40, 1.2, 0.8)
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    sector: 'Cloud & Software',
    category: 'Tech',
    price: 432.10,
    previousClose: 430.50,
    openPrice: 431.00,
    dayHigh: 434.90,
    dayLow: 429.80,
    change: 1.60,
    changePercent: 0.37,
    volume: '22,1 Mio.',
    marketCap: '3,21 Bio. €',
    peRatio: 35.2,
    dividendYield: 0.72,
    fiftyTwoWeekHigh: 468.35,
    fiftyTwoWeekLow: 366.50,
    description: 'Pionier in Enterprise Cloud (Azure), Produktivitätssuite Office 365 und künstlicher Intelligenz via Copilot.',
    history: generateHistory(432.10, 1.1, 0.5)
  },
  {
    symbol: 'SAP.DE',
    name: 'SAP SE',
    sector: 'Unternehmenssoftware',
    category: 'DAX',
    price: 204.50,
    previousClose: 201.80,
    openPrice: 202.00,
    dayHigh: 205.80,
    dayLow: 201.20,
    change: 2.70,
    changePercent: 1.34,
    volume: '2,4 Mio.',
    marketCap: '246 Mrd. €',
    peRatio: 39.4,
    dividendYield: 1.12,
    fiftyTwoWeekHigh: 208.50,
    fiftyTwoWeekLow: 135.20,
    description: 'Das wertvollste börsennotierte Unternehmen Deutschlands, weltweit führend bei ERP- und Cloud-Lösungen.',
    history: generateHistory(204.50, 1.3, 1.2)
  },
  {
    symbol: 'SIE.DE',
    name: 'Siemens AG',
    sector: 'Industrie & Digitalisierung',
    category: 'DAX',
    price: 182.20,
    previousClose: 183.90,
    openPrice: 183.50,
    dayHigh: 184.20,
    dayLow: 181.40,
    change: -1.70,
    changePercent: -0.92,
    volume: '1,8 Mio.',
    marketCap: '144 Mrd. €',
    peRatio: 16.8,
    dividendYield: 2.65,
    fiftyTwoWeekHigh: 189.40,
    fiftyTwoWeekLow: 142.10,
    description: 'Deutscher Traditionskonzern mit Fokus auf industrielle Automatisierung, intelligente Infrastruktur und Medizintechnik.',
    history: generateHistory(182.20, 1.4, -0.6)
  },
  {
    symbol: 'ALV.DE',
    name: 'Allianz SE',
    sector: 'Finanzen & Versicherungen',
    category: 'DAX',
    price: 294.00,
    previousClose: 292.40,
    openPrice: 292.80,
    dayHigh: 295.60,
    dayLow: 291.90,
    change: 1.60,
    changePercent: 0.55,
    volume: '1,1 Mio.',
    marketCap: '115 Mrd. €',
    peRatio: 11.9,
    dividendYield: 4.70,
    fiftyTwoWeekHigh: 302.20,
    fiftyTwoWeekLow: 225.00,
    description: 'Einer der weltweit größten Finanzdienstleister und Vermögensverwalter mit verlässlicher Dividendenhistorie.',
    history: generateHistory(294.00, 0.9, 0.7)
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    sector: 'Automobil & Energie',
    category: 'Tech',
    price: 218.60,
    previousClose: 224.20,
    openPrice: 222.00,
    dayHigh: 225.80,
    dayLow: 216.50,
    change: -5.60,
    changePercent: -2.50,
    volume: '68,4 Mio.',
    marketCap: '695 Mrd. €',
    peRatio: 64.2,
    dividendYield: 0.0,
    fiftyTwoWeekHigh: 271.00,
    fiftyTwoWeekLow: 138.80,
    description: 'Marktführer im Bereich Elektromobilität, Batteriespeicher, autonomes Fahren und Robotik.',
    history: generateHistory(218.60, 3.2, -1.5)
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc. (Google)',
    sector: 'Internet & KI',
    category: 'Tech',
    price: 174.30,
    previousClose: 172.50,
    openPrice: 173.00,
    dayHigh: 175.40,
    dayLow: 172.10,
    change: 1.80,
    changePercent: 1.04,
    volume: '28,9 Mio.',
    marketCap: '2,16 Bio. €',
    peRatio: 24.1,
    dividendYield: 0.46,
    fiftyTwoWeekHigh: 191.75,
    fiftyTwoWeekLow: 129.50,
    description: 'Globaler Marktführer in Online-Suche, YouTube, Google Cloud Platform und Pionier in generativer KI.',
    history: generateHistory(174.30, 1.5, 0.9)
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    sector: 'E-Commerce & Cloud',
    category: 'Tech',
    price: 192.80,
    previousClose: 190.20,
    openPrice: 191.00,
    dayHigh: 193.90,
    dayLow: 189.50,
    change: 2.60,
    changePercent: 1.37,
    volume: '34,5 Mio.',
    marketCap: '2,01 Bio. €',
    peRatio: 42.0,
    dividendYield: 0.0,
    fiftyTwoWeekHigh: 201.20,
    fiftyTwoWeekLow: 118.35,
    description: 'Gigant im weltweiten Online-Handel sowie Marktführer bei Cloud-Infrastrukturen durch AWS (Amazon Web Services).',
    history: generateHistory(192.80, 1.6, 1.1)
  },
  {
    symbol: 'BMW.DE',
    name: 'BMW AG',
    sector: 'Premium-Automobil',
    category: 'DAX',
    price: 78.40,
    previousClose: 79.20,
    openPrice: 79.00,
    dayHigh: 79.60,
    dayLow: 77.90,
    change: -0.80,
    changePercent: -1.01,
    volume: '2,2 Mio.',
    marketCap: '48 Mrd. €',
    peRatio: 5.8,
    dividendYield: 7.65,
    fiftyTwoWeekHigh: 115.35,
    fiftyTwoWeekLow: 76.50,
    description: 'Premium-Automobil- und Motorradhersteller mit den Marken BMW, MINI und Rolls-Royce sowie starker Dividendenrendite.',
    history: generateHistory(78.40, 1.8, -0.8)
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    sector: 'US-Index ETF',
    category: 'ETFs',
    price: 562.50,
    previousClose: 559.80,
    openPrice: 560.50,
    dayHigh: 563.80,
    dayLow: 559.20,
    change: 2.70,
    changePercent: 0.48,
    volume: '48,1 Mio.',
    marketCap: '540 Mrd. €',
    peRatio: 26.5,
    dividendYield: 1.25,
    fiftyTwoWeekHigh: 565.10,
    fiftyTwoWeekLow: 410.00,
    description: 'Der weltweit am meisten gehandelte ETF, der die 500 größten Unternehmen der USA abbildet.',
    history: generateHistory(562.50, 0.8, 0.6)
  },
  {
    symbol: 'URTH',
    name: 'iShares MSCI World ETF',
    sector: 'Welt-Index ETF',
    category: 'ETFs',
    price: 154.20,
    previousClose: 153.60,
    openPrice: 153.80,
    dayHigh: 154.60,
    dayLow: 153.30,
    change: 0.60,
    changePercent: 0.39,
    volume: '3,8 Mio.',
    marketCap: '82 Mrd. €',
    peRatio: 21.3,
    dividendYield: 1.55,
    fiftyTwoWeekHigh: 156.40,
    fiftyTwoWeekLow: 121.10,
    description: 'Breit gestreuter Welt-ETF mit über 1.500 Unternehmen aus 23 Industrieländern als Kernanlage.',
    history: generateHistory(154.20, 0.7, 0.5)
  },
  {
    symbol: 'DAX',
    name: 'iShares Core DAX UCITS ETF',
    sector: 'Deutscher Leitindex',
    category: 'ETFs',
    price: 168.30,
    previousClose: 167.50,
    openPrice: 167.80,
    dayHigh: 169.10,
    dayLow: 167.20,
    change: 0.80,
    changePercent: 0.48,
    volume: '2,9 Mio.',
    marketCap: '9,8 Mrd. €',
    peRatio: 14.8,
    dividendYield: 2.80,
    fiftyTwoWeekHigh: 171.20,
    fiftyTwoWeekLow: 140.50,
    description: 'Physisch replizierender ETF auf die 40 größten und umsatzstärksten Unternehmen am deutschen Aktienmarkt.',
    history: generateHistory(168.30, 1.1, 0.6)
  },
  {
    symbol: 'BTC-EUR',
    name: 'Bitcoin (BTC)',
    sector: 'Digitales Gold / Krypto',
    category: 'Krypto & Rohstoffe',
    price: 61450.00,
    previousClose: 59800.00,
    openPrice: 60100.00,
    dayHigh: 62200.00,
    dayLow: 59500.00,
    change: 1650.00,
    changePercent: 2.76,
    volume: '28,4 Mrd. €',
    marketCap: '1,21 Bio. €',
    fiftyTwoWeekHigh: 68500.00,
    fiftyTwoWeekLow: 25400.00,
    description: 'Die älteste und größte dezentrale Kryptowährung mit fester Begrenzung auf 21 Millionen Einheiten.',
    history: generateHistory(61450.00, 3.8, 2.2)
  },
  {
    symbol: 'ETH-EUR',
    name: 'Ethereum (ETH)',
    sector: 'Smart Contracts / Krypto',
    category: 'Krypto & Rohstoffe',
    price: 2420.00,
    previousClose: 2380.00,
    openPrice: 2390.00,
    dayHigh: 2465.00,
    dayLow: 2360.00,
    change: 40.00,
    changePercent: 1.68,
    volume: '14,2 Mrd. €',
    marketCap: '291 Mrd. €',
    fiftyTwoWeekHigh: 3750.00,
    fiftyTwoWeekLow: 1480.00,
    description: 'Führende Smart-Contract-Plattform für dezentrale Finanzanwendungen (DeFi) und Web3-Token.',
    history: generateHistory(2420.00, 3.5, 1.4)
  },
  {
    symbol: 'GLD',
    name: 'SPDR Gold Shares',
    sector: 'Edelmetalle & Rohstoffe',
    category: 'Krypto & Rohstoffe',
    price: 232.50,
    previousClose: 231.20,
    openPrice: 231.50,
    dayHigh: 233.10,
    dayLow: 230.90,
    change: 1.30,
    changePercent: 0.56,
    volume: '6,4 Mio.',
    marketCap: '68 Mrd. €',
    fiftyTwoWeekHigh: 238.40,
    fiftyTwoWeekLow: 172.50,
    description: 'Weltweit größter physisch besicherter Gold-ETF als klassischer Wertspeicher und Inflationsschutz.',
    history: generateHistory(232.50, 0.7, 0.4)
  }
];
