export interface ServicePrice {
  buy: number
  sell: number
  serviceType: string
  lastUpdated: string
}

export interface ServicePrices {
  [key: string]: ServicePrice
}

const STORAGE_KEY = "ufriends_service_prices"

export const defaultPrices: ServicePrices = {
  "BVN Retrieval": { buy: 1200, sell: 1500, serviceType: "BVN Retrieval", lastUpdated: new Date().toISOString() },
  "BVN Central Risk": { buy: 800, sell: 1000, serviceType: "BVN Central Risk", lastUpdated: new Date().toISOString() },
  "BVN Printout": { buy: 150, sell: 180, serviceType: "BVN Printout", lastUpdated: new Date().toISOString() },
  "NIN Slip Standard": { buy: 150, sell: 180, serviceType: "NIN Slip Standard", lastUpdated: new Date().toISOString() },
  "NIN Slip Premium": { buy: 150, sell: 180, serviceType: "NIN Slip Premium", lastUpdated: new Date().toISOString() },
  "NIN Slip Regular": { buy: 120, sell: 150, serviceType: "NIN Slip Regular", lastUpdated: new Date().toISOString() },
  "NIN Modification": { buy: 2000, sell: 2500, serviceType: "NIN Modification", lastUpdated: new Date().toISOString() },
  "NIN Printout": { buy: 150, sell: 180, serviceType: "NIN Printout", lastUpdated: new Date().toISOString() },
  "NIN Validation - Normal": {
    buy: 250,
    sell: 300,
    serviceType: "NIN Validation - Normal",
    lastUpdated: new Date().toISOString(),
  },
  "NIN Validation - Photographic Error": {
    buy: 400,
    sell: 500,
    serviceType: "NIN Validation - Photographic Error",
    lastUpdated: new Date().toISOString(),
  },
  "NIN Validation - SIM Registration": {
    buy: 200,
    sell: 250,
    serviceType: "NIN Validation - SIM Registration",
    lastUpdated: new Date().toISOString(),
  },
  "NIN Validation - Bank Validation": {
    buy: 300,
    sell: 350,
    serviceType: "NIN Validation - Bank Validation",
    lastUpdated: new Date().toISOString(),
  },
  "IPE Clearance - Normal": {
    buy: 800,
    sell: 1000,
    serviceType: "IPE Clearance - Normal",
    lastUpdated: new Date().toISOString(),
  },
  "IPE Clearance - Modification": {
    buy: 1200,
    sell: 1500,
    serviceType: "IPE Clearance - Modification",
    lastUpdated: new Date().toISOString(),
  },
  "JTB TIN - Individual": {
    buy: 3000,
    sell: 3500,
    serviceType: "JTB TIN - Individual",
    lastUpdated: new Date().toISOString(),
  },
  "JTB TIN - Business": {
    buy: 5000,
    sell: 6000,
    serviceType: "JTB TIN - Business",
    lastUpdated: new Date().toISOString(),
  },
  "ShareNSell - MTN": { buy: 0.97, sell: 0.98, serviceType: "ShareNSell - MTN", lastUpdated: new Date().toISOString() },
  "ShareNSell - Airtel": {
    buy: 0.96,
    sell: 0.97,
    serviceType: "ShareNSell - Airtel",
    lastUpdated: new Date().toISOString(),
  },
  "ShareNSell - Glo": { buy: 0.95, sell: 0.96, serviceType: "ShareNSell - Glo", lastUpdated: new Date().toISOString() },
  "ShareNSell - 9mobile": {
    buy: 0.94,
    sell: 0.95,
    serviceType: "ShareNSell - 9mobile",
    lastUpdated: new Date().toISOString(),
  },
  "Airtime2Cash - MTN": {
    buy: 0.93,
    sell: 0.94,
    serviceType: "Airtime2Cash - MTN",
    lastUpdated: new Date().toISOString(),
  },
  "Airtime2Cash - Airtel": {
    buy: 0.91,
    sell: 0.92,
    serviceType: "Airtime2Cash - Airtel",
    lastUpdated: new Date().toISOString(),
  },
  "Airtime2Cash - Glo": {
    buy: 0.89,
    sell: 0.9,
    serviceType: "Airtime2Cash - Glo",
    lastUpdated: new Date().toISOString(),
  },
  "Airtime2Cash - 9mobile": {
    buy: 0.87,
    sell: 0.88,
    serviceType: "Airtime2Cash - 9mobile",
    lastUpdated: new Date().toISOString(),
  },
  "VTU - MTN": { buy: 0.98, sell: 0.99, serviceType: "VTU - MTN", lastUpdated: new Date().toISOString() },
  "VTU - Airtel": { buy: 0.97, sell: 0.98, serviceType: "VTU - Airtel", lastUpdated: new Date().toISOString() },
  "VTU - Glo": { buy: 0.96, sell: 0.97, serviceType: "VTU - Glo", lastUpdated: new Date().toISOString() },
  "VTU - 9mobile": { buy: 0.95, sell: 0.96, serviceType: "VTU - 9mobile", lastUpdated: new Date().toISOString() },
  "SME Data - MTN": { buy: 0.95, sell: 0.97, serviceType: "SME Data - MTN", lastUpdated: new Date().toISOString() },
  "SME Data - Airtel": {
    buy: 0.94,
    sell: 0.96,
    serviceType: "SME Data - Airtel",
    lastUpdated: new Date().toISOString(),
  },
  "SME Data - Glo": { buy: 0.93, sell: 0.95, serviceType: "SME Data - Glo", lastUpdated: new Date().toISOString() },
  "SME Data - 9mobile": {
    buy: 0.92,
    sell: 0.94,
    serviceType: "SME Data - 9mobile",
    lastUpdated: new Date().toISOString(),
  },
  "Corporate Data - MTN": {
    buy: 0.96,
    sell: 0.98,
    serviceType: "Corporate Data - MTN",
    lastUpdated: new Date().toISOString(),
  },
  "Corporate Data - Airtel": {
    buy: 0.95,
    sell: 0.97,
    serviceType: "Corporate Data - Airtel",
    lastUpdated: new Date().toISOString(),
  },
  "Corporate Data - Glo": {
    buy: 0.94,
    sell: 0.96,
    serviceType: "Corporate Data - Glo",
    lastUpdated: new Date().toISOString(),
  },
  "Corporate Data - 9mobile": {
    buy: 0.93,
    sell: 0.95,
    serviceType: "Corporate Data - 9mobile",
    lastUpdated: new Date().toISOString(),
  },
  "Gift Data - MTN": {
    buy: 0.97,
    sell: 0.99,
    serviceType: "Gift Data - MTN",
    lastUpdated: new Date().toISOString(),
  },
  "Gift Data - Airtel": {
    buy: 0.96,
    sell: 0.98,
    serviceType: "Gift Data - Airtel",
    lastUpdated: new Date().toISOString(),
  },
  "Gift Data - Glo": { buy: 0.95, sell: 0.97, serviceType: "Gift Data - Glo", lastUpdated: new Date().toISOString() },
  "Gift Data - 9mobile": {
    buy: 0.94,
    sell: 0.96,
    serviceType: "Gift Data - 9mobile",
    lastUpdated: new Date().toISOString(),
  },
  "Cable - DSTV": { buy: 0, sell: 0, serviceType: "Cable - DSTV", lastUpdated: new Date().toISOString() },
  "Cable - GOTV": { buy: 0, sell: 0, serviceType: "Cable - GOTV", lastUpdated: new Date().toISOString() },
  "Cable - Startimes": { buy: 0, sell: 0, serviceType: "Cable - Startimes", lastUpdated: new Date().toISOString() },
  "Electricity - EKEDC": { buy: 0, sell: 0, serviceType: "Electricity - EKEDC", lastUpdated: new Date().toISOString() },
  "Electricity - IE": { buy: 0, sell: 0, serviceType: "Electricity - IE", lastUpdated: new Date().toISOString() },
  "Electricity - AEDC": { buy: 0, sell: 0, serviceType: "Electricity - AEDC", lastUpdated: new Date().toISOString() },
  "Electricity - KEDCO": { buy: 0, sell: 0, serviceType: "Electricity - KEDCO", lastUpdated: new Date().toISOString() },
  "Electricity - PHED": { buy: 0, sell: 0, serviceType: "Electricity - PHED", lastUpdated: new Date().toISOString() },
  "Electricity - IBEDC": { buy: 0, sell: 0, serviceType: "Electricity - IBEDC", lastUpdated: new Date().toISOString() },
  "Electricity - EEDC": { buy: 0, sell: 0, serviceType: "Electricity - EEDC", lastUpdated: new Date().toISOString() },
}

export function getServicePrices(): ServicePrices {
  if (typeof window === "undefined") return defaultPrices

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPrices))
    return defaultPrices
  }

  return JSON.parse(stored)
}

export function getServicePrice(serviceType: string): number {
  const prices = getServicePrices()
  return prices[serviceType]?.sell || 0
}

export function updateServicePrice(serviceType: string, buy: number, sell: number): void {
  const prices = getServicePrices()
  prices[serviceType] = {
    buy,
    sell,
    serviceType,
    lastUpdated: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prices))
}

export function formatPrice(price: number): string {
  return `₦${price.toLocaleString()}`
}
