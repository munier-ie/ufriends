import { prisma } from "@/lib/db"

export interface ProviderConfig {
  id: string
  name: string
  category: string
  isActive: boolean
  priority: number
  apiBaseUrl: string | null
  configJson: Record<string, unknown>
  apiKeys: Array<{
    id: string
    keyName: string
    keyValue: string
  }>
}

export interface ServiceProviderInfo {
  provider: ProviderConfig | null
  fallbackProviders: ProviderConfig[]
  hasActiveProvider: boolean
}

/**
 * Get the active provider for a specific service category
 */
export async function getActiveProvider(category: string): Promise<ServiceProviderInfo> {
  try {
    const providers = await prisma.serviceProvider.findMany({
      where: { category },
      include: {
        apiKeys: {
          select: {
            id: true,
            keyName: true,
            keyValue: true
          }
        }
      },
      orderBy: [
        { isActive: "desc" },
        { priority: "desc" },
        { name: "asc" }
      ]
    })

    const toConfig = (p: typeof providers[number]): ProviderConfig => ({
      id: p.id,
      name: p.name,
      category: p.category,
      isActive: p.isActive,
      priority: p.priority,
      apiBaseUrl: p.apiBaseUrl,
      configJson: p.configJson as Record<string, unknown>,
      apiKeys: p.apiKeys
    })

    const activeProviderRaw = providers.find(p => p.isActive) || null
    const fallbackProvidersRaw = providers.filter(p => !p.isActive && p.priority > 0)

    return {
      provider: activeProviderRaw ? toConfig(activeProviderRaw) : null,
      fallbackProviders: fallbackProvidersRaw.map(toConfig),
      hasActiveProvider: !!activeProviderRaw
    }
  } catch (error) {
    console.error(`Failed to get active provider for category ${category}:`, error)
    return {
      provider: null,
      fallbackProviders: [],
      hasActiveProvider: false
    }
  }
}

/**
 * Get API key value by name for a specific provider
 */
export async function getProviderApiKey(providerId: string, keyName: string): Promise<string | null> {
  try {
    const apiKey = await prisma.providerApiKey.findFirst({
      where: {
        providerId,
        keyName
      },
      select: {
        keyValue: true
      }
    })

    return apiKey?.keyValue || null
  } catch (error) {
    console.error(`Failed to get API key ${keyName} for provider ${providerId}:`, error)
    return null
  }
}

/**
 * Get all API keys for a provider as a key-value object
 */
export async function getProviderApiKeys(providerId: string): Promise<Record<string, string>> {
  try {
    const apiKeys = await prisma.providerApiKey.findMany({
      where: { providerId },
      select: {
        keyName: true,
        keyValue: true
      }
    })

    return apiKeys.reduce<Record<string, string>>((acc, key) => {
      acc[key.keyName] = key.keyValue
      return acc
    }, {})
  } catch (error) {
    console.error(`Failed to get API keys for provider ${providerId}:`, error)
    return {}
  }
}

/**
 * Check if a provider is available and active
 */
export async function isProviderAvailable(category: string): Promise<boolean> {
  try {
    const activeProvider = await prisma.serviceProvider.findFirst({
      where: {
        category,
        isActive: true
      }
    })

    return !!activeProvider
  } catch (error) {
    console.error(`Failed to check provider availability for category ${category}:`, error)
    return false
  }
}

/**
 * Get provider configuration with decrypted API keys
 */
export async function getProviderConfig(providerId: string): Promise<ProviderConfig | null> {
  try {
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        apiKeys: {
          select: {
            id: true,
            keyName: true,
            keyValue: true
          }
        }
      }
    })

    if (!provider) return null

    return {
      id: provider.id,
      name: provider.name,
      category: provider.category,
      isActive: provider.isActive,
      priority: provider.priority,
      apiBaseUrl: provider.apiBaseUrl,
      configJson: provider.configJson as Record<string, unknown>,
      apiKeys: provider.apiKeys
    }
  } catch (error) {
    console.error(`Failed to get provider config for ${providerId}:`, error)
    return null
  }
}

/**
 * Update provider status (activate/deactivate)
 */
export async function updateProviderStatus(providerId: string, isActive: boolean): Promise<boolean> {
  try {
    await prisma.serviceProvider.update({
      where: { id: providerId },
      data: { 
        isActive,
        updatedAt: new Date()
      }
    })
    return true
  } catch (error) {
    console.error(`Failed to update provider status for ${providerId}:`, error)
    return false
  }
}

/**
 * Get all providers for a category with their status
 */
export async function getCategoryProviders(category: string): Promise<ProviderConfig[]> {
  try {
    const providers = await prisma.serviceProvider.findMany({
      where: { category },
      include: {
        apiKeys: {
          select: {
            id: true,
            keyName: true,
            keyValue: true
          }
        }
      },
      orderBy: [
        { isActive: "desc" },
        { priority: "desc" },
        { name: "asc" }
      ]
    })

    return providers.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      isActive: p.isActive,
      priority: p.priority,
      apiBaseUrl: p.apiBaseUrl,
      configJson: p.configJson as Record<string, unknown>,
      apiKeys: p.apiKeys
    }))
  } catch (error) {
    console.error(`Failed to get providers for category ${category}:`, error)
    return []
  }
}