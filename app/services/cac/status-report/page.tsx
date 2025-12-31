import { CacStatusReportForm } from "@/components/cac-status-report-form"

export default function CacStatusReportPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">CAC Status Report</h1>
            <p className="text-muted-foreground">
              Verify the official registration status of your business or company through our CAC services.
            </p>
          </div>
          <CacStatusReportForm />
        </div>
      </main>
    </div>
  )
}
