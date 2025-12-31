import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import getPrembly from "@/lib/prembly-sdk-adapter"

// Unified verification endpoint
// POST /api/verification
// Body: { action: string, params: Record<string, any> }
// Supported actions (Prembly-backed):
// - "bvn.printout"            => { bvn }
// - "bvn.retrieval_phone"     => { phoneNumber }
// - "bvn.advanced"            => { bvn }
// - "nin.printout"            => { nin }
// - "nin.slip"                => { nin }
// - "nin.advanced"            => { nin, phoneNumber?, firstName?, lastName?, dateOfBirth?, gender? }
// - "cac.info"                => { rcNumber }
// - "cac.status"              => { rcNumber }
// - "passport.verify"         => { passportNumber, lastName? }
// - "drivers_license.verify"  => { licenseNumber?, expiryDate?, firstName?, lastName?, dob? }
// - "tin.verify"              => { tin }
// - "voters.verify"           => { vin }
// - "plate.verify"            => { plateNumber }
// - "phone.verify_advanced"   => { phoneNumber }

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { ensureKyc } = await import("@/lib/kyc-check")
    const kycError = await ensureKyc((session.user as any).id)
    if (kycError) return kycError

    const premblyClient = getPrembly()

    const body = await req.json().catch(() => ({}))
    const action: string = String(body?.action || "").trim()
    const params: Record<string, any> = (body?.params || {}) as Record<string, any>

    if (!action) {
      return NextResponse.json({ error: "Missing 'action' in request body" }, { status: 400 })
    }

    // Basic validators per action
    const requireField = (key: string) => {
      if (!params[key] || String(params[key]).trim() === "") {
        throw new Error(`Missing required field: ${key}`)
      }
    }

    let result: any

    switch (action) {
      // BVN
      case "bvn.printout": {
        requireField("bvn")
        result = await premblyClient.getBVNPrintout({ bvn: String(params.bvn) })
        break
      }
      case "bvn.retrieval_phone": {
        requireField("phoneNumber")
        result = await premblyClient.getBVNByPhone({ phoneNumber: String(params.phoneNumber) })
        break
      }
      case "bvn.advanced": {
        requireField("bvn")
        result = await premblyClient.getBVNAdvanced({ bvn: String(params.bvn) })
        break
      }

      // NIN
      case "nin.printout": {
        requireField("nin")
        result = await premblyClient.getNINPrintout({ nin: String(params.nin) })
        break
      }
      case "nin.slip": {
        requireField("nin")
        result = await premblyClient.getNINSlip({ nin: String(params.nin) })
        break
      }
      case "nin.advanced": {
        requireField("nin")
        result = await premblyClient.getNINAdvanced({
          nin: String(params.nin),
          phoneNumber: params.phoneNumber ? String(params.phoneNumber) : undefined,
          firstName: params.firstName ? String(params.firstName) : undefined,
          lastName: params.lastName ? String(params.lastName) : undefined,
          dateOfBirth: params.dateOfBirth ? String(params.dateOfBirth) : undefined,
          gender: params.gender ? String(params.gender) : undefined,
        })
        break
      }

      // CAC (Advance) - supports RC, BN, IT via companyType
      case "cac.info": {
        const rawNumber = params.number ?? params.rcNumber
        if (!rawNumber || String(rawNumber).trim() === "") throw new Error("Missing required field: number")
        const companyType = params.companyType ? String(params.companyType).toUpperCase() : undefined
        const companyName = params.companyName ? String(params.companyName) : undefined
        result = await premblyClient.getCACInfo({ number: String(rawNumber), companyType: companyType as any, companyName })
        break
      }
      case "cac.status": {
        const rawNumber = params.number ?? params.rcNumber
        if (!rawNumber || String(rawNumber).trim() === "") throw new Error("Missing required field: number")
        const companyType = params.companyType ? String(params.companyType).toUpperCase() : undefined
        const companyName = params.companyName ? String(params.companyName) : undefined
        result = await premblyClient.getCACStatusReport({ number: String(rawNumber), companyType: companyType as any, companyName })
        break
      }

      // Passport
      case "passport.verify": {
        requireField("passportNumber")
        result = await premblyClient.verifyInternationalPassportV2({
          passportNumber: String(params.passportNumber),
          lastName: params.lastName ? String(params.lastName) : undefined,
        })
        break
      }

      // Drivers License (Advanced v2)
      case "drivers_license.verify": {
        result = await premblyClient.verifyDriversLicenseAdvanced({
          licenseNumber: params.licenseNumber ? String(params.licenseNumber) : undefined,
          expiryDate: params.expiryDate ? String(params.expiryDate) : undefined,
          firstName: params.firstName ? String(params.firstName) : undefined,
          lastName: params.lastName ? String(params.lastName) : undefined,
          dob: params.dob ? String(params.dob) : undefined,
        })
        break
      }

      // TIN
      case "tin.verify": {
        requireField("tin")
        result = await premblyClient.verifyTIN({ tin: String(params.tin) })
        break
      }

      // Voters Card
      case "voters.verify": {
        requireField("number")
        result = await premblyClient.verifyVotersCard({
          number: String(params.number),
          lastName: params.lastName ? String(params.lastName) : undefined,
          firstName: params.firstName ? String(params.firstName) : undefined,
          dob: params.dob ? String(params.dob) : undefined,
          lga: params.lga ? String(params.lga) : undefined,
          state: params.state ? String(params.state) : undefined,
        })
        break
      }

      // Plate number
      case "plate.verify": {
        requireField("plateNumber")
        result = await premblyClient.verifyPlateNumber({ plateNumber: String(params.plateNumber) })
        break
      }

      // Phone (advanced)
      case "phone.verify_advanced": {
        requireField("phoneNumber")
        result = await premblyClient.verifyPhoneAdvanced({ phoneNumber: String(params.phoneNumber) })
        break
      }

      default:
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 })
    }

    if (!result?.status) {
      return NextResponse.json({ error: result?.detail || result?.error || "Verification failed" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    const message = err?.message || String(err) || "Failed to process request"
    const isBadRequest = typeof message === "string" && message.startsWith("Missing required field:")
    const status = isBadRequest ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function GET() {
  // Discover supported actions
  const actions = [
    "bvn.printout",
    "bvn.retrieval_phone",
    "bvn.advanced",
    "nin.printout",
    "nin.slip",
    "nin.advanced",
    "cac.info",
    "cac.status",
    "passport.verify",
    "drivers_license.verify",
    "tin.verify",
    "voters.verify",
    "plate.verify",
    "phone.verify_advanced",
  ]
  return NextResponse.json({ ok: true, actions })
}