"use client"

import { EnhancedProviderManager } from "@/components/admin/enhanced-provider-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminProvidersPage() {
  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>API Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage integration providers separately from services. Add, edit, activate, test, and remove providers.
          </p>
        </CardContent>
      </Card>

      <EnhancedProviderManager />
    </div>
  )
}