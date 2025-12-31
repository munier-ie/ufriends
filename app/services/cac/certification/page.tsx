import { CacRetrievalForm } from "@/components/cac-retrieval-form"

export default function CacRetrievalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">CAC Certificate Retrieval</h1>
            <p className="text-muted-foreground">
              Retrieve your existing CAC registration certificate and details quickly and securely.
            </p>
          </div>
          <CacRetrievalForm />
        </div>
      </main>
    </div>
  )
}
