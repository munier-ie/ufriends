import { getActiveProvider, isProviderAvailable, type ServiceProviderInfo } from "./provider-manager"

export const UFRIENDS_SERVICES = [
  {
    id: "airtime",
    name: "Airtime",
    description: "Buy airtime for all networks instantly",
    icon: "Smartphone",
    color: "text-blue-600",
    commission: "5-8%",
    subServices: [
      { id: "vtu", name: "VTU", description: "Virtual Top-Up for instant airtime recharge" },
      { id: "share-n-sell", name: "Share 'n Sell", description: "Share and sell airtime to earn commissions" },
      { id: "airtime-2-cash", name: "Airtime 2 Cash", description: "Convert excess airtime to cash" },
    ],
  },
  {
    id: "data",
    name: "Data",
    description: "Purchase data bundles at competitive rates",
    icon: "Wifi",
    color: "text-green-600",
    commission: "5-8%",
    subServices: [
      { id: "sme", name: "SME Data", description: "Affordable SME data bundles for all networks" },
      { id: "corporate", name: "Corporate Data", description: "Corporate data plans for businesses" },
      { id: "gift", name: "Gift Data", description: "Send data bundles as gifts" },
    ],
  },
  {
    id: "bills",
    name: "Bills",
    description: "Pay utility bills conveniently",
    icon: "Receipt",
    color: "text-orange-600",
    commission: "3-5%",
    subServices: [
      { id: "electricity", name: "Electricity", description: "Pay electricity bills" },
      { id: "water", name: "Water", description: "Pay water bills" },
      { id: "internet", name: "Internet", description: "Pay internet bills" },
    ],
  },
  {
    id: "bvn",
    name: "BVN Services",
    description: "BVN verification and related services",
    icon: "UserCheck",
    color: "text-purple-600",
    commission: "8-12%",
    subServices: [
      { id: "android-license", name: "Android License", description: "BVN Android license for mobile banking" },
      { id: "modification", name: "BVN Modification", description: "Update and modify BVN details" },
      { id: "retrieval", name: "BVN Retrieval", description: "Retrieve forgotten BVN" },
      { id: "central-risk", name: "Central Risk Management", description: "Check central risk status" },
      { id: "printout", name: "BVN Print Out", description: "Print BVN slip and documents" },
    ],
  },
  {
    id: "nin",
    name: "NIN Services",
    description: "National ID verification services",
    icon: "IdCard",
    color: "text-red-600",
    commission: "8-12%",
    subServices: [
      { id: "validation", name: "NIN Validation", description: "Validate National ID numbers" },
      { id: "verification", name: "NIN Verification", description: "Verify NIN details" },
    ],
  },
  {
    id: "cac",
    name: "CAC Registration",
    description: "Business registration and incorporation",
    icon: "Building2",
    color: "text-indigo-600",
    commission: "10-15%",
    subServices: [
      { id: "registration", name: "CAC Registration", description: "Register new business with CAC" },
      { id: "status-report", name: "Status Report", description: "Get CAC status report" },
      { id: "certification", name: "Certification", description: "Get CAC certification" },
    ],
  },
  {
    id: "education",
    name: "Education",
    description: "Educational services and resources",
    icon: "GraduationCap",
    color: "text-teal-600",
    commission: "5-10%",
    subServices: [
      { id: "jamb", name: "JAMB Services", description: "JAMB registration and services" },
      { id: "nysc", name: "NYSC Services", description: "NYSC registration and services" },
    ],
  },
  {
    id: "agency-banking",
    name: "Agency Banking",
    description: "POS and banking services",
    icon: "Banknote",
    color: "text-yellow-600",
    commission: "10-15%",
    subServices: [
      { id: "pos", name: "POS Terminals", description: "POS terminal acquisition and management" },
      { id: "marketer", name: "Marketer Program", description: "Become a UFriends marketer" },
    ],
  },
  {
    id: "verification",
    name: "Verification",
    description: "Identity and document verification",
    icon: "ShieldCheck",
    color: "text-pink-600",
    commission: "8-12%",
    subServices: [
      { id: "identity", name: "Identity Verification", description: "Verify identity documents" },
      { id: "document", name: "Document Verification", description: "Verify official documents" },
    ],
  },
  {
    id: "training",
    name: "Training",
    description: "Professional training and development",
    icon: "BookOpen",
    color: "text-cyan-600",
    commission: "5-10%",
    subServices: [
      { id: "online", name: "Online Training", description: "Online professional courses" },
      { id: "certification", name: "Certification", description: "Professional certifications" },
    ],
  },
  {
    id: "software-development",
    name: "Software Development",
    description: "Custom software solutions",
    icon: "Code",
    color: "text-violet-600",
    commission: "15-20%",
    subServices: [
      { id: "web", name: "Web Development", description: "Custom web applications" },
      { id: "mobile", name: "Mobile Development", description: "Mobile app development" },
    ],
  },
]

type ServiceDef = typeof UFRIENDS_SERVICES[number]
export type ServiceWithProvider = ServiceDef & {
  providerInfo?: ServiceProviderInfo
  isAvailable?: boolean
}

export function getServiceById(id: string) {
  return UFRIENDS_SERVICES.find(service => service.id === id)
}

export function getAllSubServices() {
  return UFRIENDS_SERVICES.flatMap(service => 
    service.subServices.map(subService => ({
      ...subService,
      parentService: service.name,
      parentId: service.id,
      commission: service.commission
    }))
  )
}

/**
 * Get service with provider information
 */
export async function getServiceWithProvider(id: string): Promise<ServiceWithProvider | undefined> {
  const service = getServiceById(id)
  if (!service) return undefined

  try {
    const providerInfo = await getActiveProvider(id)
    const isAvailable = await isProviderAvailable(id)

    return {
      ...service,
      providerInfo,
      isAvailable
    }
  } catch (error) {
    console.error(`Failed to get provider info for service ${id}:`, error)
    return {
      ...service,
      isAvailable: false
    }
  }
}

/**
 * Get all services with their provider availability status
 */
export async function getAllServicesWithProviders(): Promise<ServiceWithProvider[]> {
  const servicesWithProviders = await Promise.all(
    UFRIENDS_SERVICES.map(async (service) => {
      try {
        const providerInfo = await getActiveProvider(service.id)
        const isAvailable = await isProviderAvailable(service.id)

        return {
          ...service,
          providerInfo,
          isAvailable
        }
      } catch (error) {
        console.error(`Failed to get provider info for service ${service.id}:`, error)
        return {
          ...service,
          isAvailable: false
        }
      }
    })
  )

  return servicesWithProviders
}

/**
 * Check if a service category has an active provider
 */
export async function hasActiveProvider(serviceId: string): Promise<boolean> {
  try {
    return await isProviderAvailable(serviceId)
  } catch (error) {
    console.error(`Failed to check provider availability for service ${serviceId}:`, error)
    return false
  }
}

/**
 * Get available services (those with active providers)
 */
export async function getAvailableServices(): Promise<ServiceWithProvider[]> {
  const allServices = await getAllServicesWithProviders()
  return allServices.filter(service => service.isAvailable)
}
