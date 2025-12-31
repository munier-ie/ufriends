export function isManualService(serviceId: string, subServiceId?: string): boolean {
    const sId = serviceId.toLowerCase()
    const subId = subServiceId?.toLowerCase()

    // BVN: printout, advanced, retrieval_phone are automated
    if (sId === "bvn") {
        const auto = ["printout", "retrieval"]
        return !subId || !auto.includes(subId)
    }

    // NIN: slip, printout, advanced are automated
    if (sId === "nin") {
        const auto = ["slip", "printout", "advanced"]
        return !subId || !auto.includes(subId)
    }

    // CAC: status-report, certification, info, status are automated
    if (sId === "cac") {
        const auto = ["status-report", "certification", "status", "info"]
        return !subId || !auto.includes(subId)
    }

    // POS and Software: Always manual
    if (sId === "pos-requests" || sId === "software-development") return true

    return false
}

export function handleServiceError(resp: any, toast: any, title = "Error") {
    const message = resp.error || resp.message || "An unexpected error occurred"
    toast({
        title,
        description: message,
        variant: "destructive",
    })
}
