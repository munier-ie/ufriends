import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/require-auth"
import { prisma } from "@/lib/db"
import { renderHtmlToPdfBuffer } from "@/lib/pdf"
import getPrembly from "@/lib/prembly-sdk-adapter"

// POST /api/pdf
// Body: { templateId: string, action: string, params: Record<string, any>, fileName?: string }
// - templateId: NinTemplate.id (HTML with placeholders like {{firstName}})
// - action: one of the unified verification actions handled by /api/verification
// - params: payload for the selected action
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN", "AGENT", "USER"] })
    if (!auth.ok) return auth.response

    const reqBody = await req.json().catch(() => ({}))
    const { templateId, action, params, fileName, data: directData } = reqBody || {}
    if (process.env.NODE_ENV !== "production") {
      try {
        console.log("[PDF] request", {
          action,
          templateId,
          hasDirectData: !!directData,
          paramsKeys: params && typeof params === "object" ? Object.keys(params) : []
        })
      } catch { }
    }

    if (!templateId || typeof templateId !== "string") {
      return NextResponse.json({ error: "Missing templateId" }, { status: 400 })
    }
    if (!action || typeof action !== "string") {
      return NextResponse.json({ error: "Missing action" }, { status: 400 })
    }

    // Fetch template
    const tpl = await prisma.ninTemplate.findUnique({ where: { id: templateId } })
    if (!tpl || !tpl.isActive) {
      return NextResponse.json({ error: "Template not found or inactive" }, { status: 404 })
    }

    const premblyClient = getPrembly()

    // If direct verification data provided, skip upstream call
    let result: any
    let data: any = null
    if (directData && typeof directData === "object") {
      result = { status: true, data: directData }
      data = directData
    } else {
      // Call Prembly via our client based on action (reusing mapping in /api/verification)
      switch (action) {
        case "bvn.printout":
          result = await premblyClient.getBVNPrintout({ bvn: String(params?.bvn || "") })
          break
        case "bvn.retrieval_phone":
          result = await premblyClient.getBVNByPhone({ phoneNumber: String(params?.phoneNumber || "") })
          break
        case "bvn.advanced":
          result = await premblyClient.getBVNAdvanced({ bvn: String(params?.bvn || "") })
          break
        case "nin.printout":
          result = await premblyClient.getNINPrintout({ nin: String(params?.nin || "") })
          break
        case "nin.slip":
          result = await premblyClient.getNINSlip({ nin: String(params?.nin || "") })
          break
        case "nin.advanced":
          result = await premblyClient.getNINAdvanced({
            nin: String(params?.nin || ""),
            phoneNumber: params?.phoneNumber,
            firstName: params?.firstName,
            lastName: params?.lastName,
            dateOfBirth: params?.dateOfBirth,
            gender: params?.gender,
          })
          break
        case "cac.info":
          result = await premblyClient.getCACInfo({
            number: String(params?.number ?? params?.rcNumber ?? ""),
            companyType: params?.companyType ? String(params.companyType).toUpperCase() as any : undefined,
            companyName: params?.companyName ? String(params.companyName) : undefined,
          })
          break
        case "cac.status":
          result = await premblyClient.getCACStatusReport({
            number: String(params?.number ?? params?.rcNumber ?? ""),
            companyType: params?.companyType ? String(params.companyType).toUpperCase() as any : undefined,
            companyName: params?.companyName ? String(params.companyName) : undefined,
          })
          break
        case "passport.verify":
          result = await premblyClient.verifyInternationalPassportV2({
            passportNumber: String(params?.passportNumber || ""),
            lastName: params?.lastName,
          })
          break
        case "tin.verify":
          result = await premblyClient.verifyTIN({ tin: String(params?.tin || "") })
          break
        case "voters.verify":
          result = await premblyClient.verifyVotersCard({
            number: String(params?.number ?? params?.vin ?? ""),
            lastName: params?.lastName ? String(params.lastName) : undefined,
            firstName: params?.firstName ? String(params.firstName) : undefined,
            dob: params?.dob ? String(params.dob) : undefined,
            lga: params?.lga ? String(params.lga) : undefined,
            state: params?.state ? String(params.state) : undefined,
          })
          break
        case "plate.verify":
          result = await premblyClient.verifyPlateNumber({ plateNumber: String(params?.plateNumber || "") })
          break
        case "phone.verify_advanced":
          result = await premblyClient.verifyPhoneAdvanced({ phoneNumber: String(params?.phoneNumber || "") })
          break
        case "drivers_license.verify":
          result = await premblyClient.verifyDriversLicenseAdvanced({
            licenseNumber: params?.licenseNumber ? String(params.licenseNumber) : undefined,
            expiryDate: params?.expiryDate ? String(params.expiryDate) : undefined,
            firstName: params?.firstName ? String(params.firstName) : undefined,
            lastName: params?.lastName ? String(params.lastName) : undefined,
            dob: params?.dob ? String(params.dob) : undefined,
          })
          break
        default:
          return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 })
      }

      if (!result?.status) {
        return NextResponse.json({ error: result?.detail || result?.error || "Upstream verification failed" }, { status: 400 })
      }

      if (process.env.NODE_ENV !== "production") {
        try {
          console.log("[PDF] upstream status", { status: !!result?.status, detail: result?.detail || result?.error })
        } catch { }
      }

      // Create a simple placeholder substitution from templateContent
      data = result?.data || (result as any)?.result || {}
    }
    if (data && typeof data === "object") {
      if ((data as any).data) data = (data as any).data
      if ((data as any).nin_data) data = (data as any).nin_data
    }
    if (process.env.NODE_ENV !== "production") {
      try {
        const src: any = data || {}
        const rawImg = src.photo || src.image || src.imageUrl || src.base64Image || src.image_base64 || src.imageBase64 || src.photo_base64 || src.photoBase64 || ""
        const head = typeof rawImg === "string" ? String(rawImg).slice(0, 120) : ""
        console.log("[PDF] data keys", Object.keys(src))
        console.log("[PDF] data image preview", head)
      } catch { }
    }
    const aliases: Record<string, any> = {}
    if (action.startsWith("nin.")) {
      const src = data || {}
      const firstName = src.first_name || src.firstname || src.firstName || src.given_names || src.givenNames || src.given_name || ""
      const lastName = src.last_name || src.lastname || src.lastName || src.surname || ""
      const middleName = src.middle_name || src.middlename || src.middleName || src.other_names || src.otherNames || ""
      const givenNames = src.given_names || src.givenNames || [firstName, middleName].filter(Boolean).join(" ")
      const sex = src.sex || src.gender || ""
      const gender = src.gender || src.sex || ""
      const nin = src.nin || src.nin_number || src.ninNumber || ""
      const address = src.address || src.residential_address || src.homeAddress || src.residentialAddress || ""
      const trackingId = src.tracking_id || src.trackingId || src.nimc_trackingId || ""
      const phoneNumber = src.phone_number || src.phoneNumber || src.msisdn || src.telephoneno || ""
      const residenceState = src.residence_state || src.stateOfResidence || src.residential_state || ""
      const residenceTown = src.residence_town || src.residence_lga || src.lga || src.lgaOfResidence || ""
      const birthState = src.birth_state || src.stateOfOrigin || src.state_of_origin || src.birthstate || ""
      const birthLga = src.birth_lga || src.lgaOfOrigin || src.lga_of_origin || src.birthlga || ""
      let image = src.photo || src.photoUrl || src.image || src.imageUrl || src.base64Image || src.image_base64 || src.imageBase64 || src.photo_base64 || src.photoBase64 || ""
      const _imgRaw = typeof image === "string" ? String(image) : ""
      const _imgCompact = _imgRaw.replace(/\s+/g, "").trim()
      image = _imgCompact || image
      const looksLikeDataUrl = typeof image === "string" && /^data:image\/(png|jpeg|jpg);base64,/i.test(String(image))
      const looksLikeHttp = typeof image === "string" && /^(https?:\/\/|\/)/i.test(String(image))
      const base64Candidate = typeof image === "string" && !looksLikeDataUrl && !looksLikeHttp && /^[A-Za-z0-9+/=]+$/.test(String(image)) && String(image).length > 30
      if (base64Candidate) {
        const raw = String(image)
        const isPng = /^iVBOR/.test(raw)
        const isJpg = /^\/9j\//.test(raw)
        const mime = isPng ? "image/png" : "image/jpeg"
        image = `data:${mime};base64,${raw}`
      } else if (!image && typeof src.photo === "string" && src.photo.length > 30) {
        const raw = String(src.photo).replace(/\s+/g, "").trim()
        const isPng = /^iVBOR/.test(raw)
        const mime = isPng ? "image/png" : "image/jpeg"
        image = `data:${mime};base64,${raw}`
      } else if (!image && typeof src.base64Image === "string" && src.base64Image.length > 30) {
        const raw = String(src.base64Image).replace(/\s+/g, "").trim()
        const isPng = /^iVBOR/.test(raw)
        const mime = isPng ? "image/png" : "image/jpeg"
        image = `data:${mime};base64,${raw}`
      } else if (!image && typeof src.image_base64 === "string" && src.image_base64.length > 30) {
        const raw = String(src.image_base64).replace(/\s+/g, "").trim()
        const isPng = /^iVBOR/.test(raw)
        const mime = isPng ? "image/png" : "image/jpeg"
        image = `data:${mime};base64,${raw}`
      } else if (!image && typeof src.imageBase64 === "string" && src.imageBase64.length > 30) {
        const raw = String(src.imageBase64).replace(/\s+/g, "").trim()
        const isPng = /^iVBOR/.test(raw)
        const mime = isPng ? "image/png" : "image/jpeg"
        image = `data:${mime};base64,${raw}`
      }
      if (!image) {
        const pick = (v: any) => {
          const s = typeof v === "string" ? String(v).replace(/\s+/g, "").trim() : ""
          const isDataUrl = /^data:image\/(png|jpeg|jpg);base64,/i.test(s)
          const isHttp = /^(https?:\/\/|\/)/i.test(s)
          const isBase64 = !isDataUrl && !isHttp && /^[A-Za-z0-9+/=]+$/.test(s) && s.length > 30
          if (isDataUrl || isHttp) return s
          if (isBase64) {
            const isPng = /^iVBOR/.test(s)
            const mime = isPng ? "image/png" : "image/jpeg"
            return `data:${mime};base64,${s}`
          }
          return ""
        }
        for (const [k, v] of Object.entries(src)) {
          if (!image && typeof v === "string" && /(image|photo|portrait)/i.test(k)) {
            const cand = pick(v)
            if (cand) { image = cand; break }
          } else if (!image && v && typeof v === "object") {
            for (const [k2, v2] of Object.entries(v as any)) {
              if (typeof v2 === "string" && /(image|photo|portrait|base64)/i.test(k2)) {
                const cand2 = pick(v2)
                if (cand2) { image = cand2; break }
              }
            }
          }
        }
      }
      const issueDate = src.issue_date || src.issueDate || new Date().toISOString().slice(0, 10)
      let qrCode = src.qr_code || src.qrCode || ""
      const email = src.email || ""
      const employmentStatus = src.employmentstatus || src.employment_status || ""
      const maritalStatus = src.maritalstatus || src.marital_status || ""
      const educationalLevel = src.educationallevel || src.education_level || ""
      const birthCountry = src.birthcountry || src.birth_country || ""
      const height = src.heigth || src.height || ""
      const parentFirstName = src.pfirstname || src.parent_firstname || ""
      const spokenLanguage = src.ospokenlang || src.spoken_language || ""
      const centralId = src.centralID || src.central_id || ""
      const nokFirst = src.nok_firstname || ""
      const nokMiddle = src.nok_middlename || ""
      const nokSurname = src.nok_surname || ""
      const nokAddress1 = src.nok_address1 || ""
      const nokAddress2 = src.nok_address2 || ""
      const nokState = src.nok_state || ""
      const nokLgaTown = src.nok_town || src.nok_lga || ""
      const nokPostalCode = src.nok_postalcode || ""
      aliases.surname = lastName
      aliases.first_name = firstName
      aliases.middle_name = middleName
      aliases.given_names = givenNames
      aliases.sex = sex
      aliases.gender = gender
      aliases.nin = nin
      const dobRaw = src.birthdate || src.date_of_birth || src.dob || src.dateOfBirth || ""
      const fmtDate = (v: any) => {
        const s = String(v || "").trim()
        if (!s) return ""
        let d: Date | null = null
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
          d = new Date(s)
        } else if (/^\d{2}[\/-]\d{2}[\/-]\d{4}$/.test(s)) {
          const [a, b, c] = s.split(/[\/-]/).map(Number)
          d = new Date(c, (b || 1) - 1, a)
        } else if (!isNaN(Date.parse(s))) {
          d = new Date(Date.parse(s))
        }
        if (!d || isNaN(d.getTime())) return s
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
        const dd = String(d.getDate()).padStart(2, "0")
        const mmm = months[d.getMonth()] || ""
        const yyyy = d.getFullYear()
        return `${dd} ${mmm} ${yyyy}`
      }
      aliases.dob = fmtDate(dobRaw)
      const ninDigits = String(nin || "").replace(/\D+/g, "")
      const ninSpaced = ninDigits.length === 11 ? `${ninDigits.slice(0, 4)} ${ninDigits.slice(4, 7)} ${ninDigits.slice(7)}` : nin
      aliases.nin_spaced = ninSpaced
      aliases.address = address
      aliases.image = image
      aliases.photo = ""
      aliases.imageUrl = ""
      aliases.photoUrl = ""
      if (typeof image === "string" && /^data:image\/(png|jpeg|jpg);base64,/i.test(String(image))) {
        aliases.base64Image = image.replace(/^data:image\/(png|jpeg|jpg);base64,/i, "").replace(/\s+/g, "")
      } else if (typeof image === "string" && /^[A-Za-z0-9+/=]+$/.test(String(image)) && String(image).length > 50) {
        aliases.base64Image = String(image).replace(/\s+/g, "").trim()
        aliases.image = `data:image/jpeg;base64,${aliases.base64Image}`
        aliases.photo = ""
        aliases.imageUrl = ""
        aliases.photoUrl = ""
      }
      try {
        if (typeof aliases.image === "string" && aliases.image) {
          (data as any).image = aliases.image
            ; (data as any).photo = aliases.image
            ; (data as any).imageUrl = aliases.image
            ; (data as any).photoUrl = aliases.image
        }
      } catch { }
      if (process.env.NODE_ENV !== "production") {
        try {
          const imh = typeof aliases.image === "string" ? String(aliases.image).slice(0, 120) : ""
          const b64len = typeof aliases.base64Image === "string" ? String(aliases.base64Image).length : 0
          console.log("[PDF] nin aliases", { imageHead: imh, base64Len: b64len, qr: !!aliases.qr_code })
        } catch { }
      }
      aliases.tracking_id = trackingId
      aliases.trackingId = trackingId
      aliases.phone_number = phoneNumber
      aliases.phoneNumber = phoneNumber
      aliases.residence_state = residenceState
      aliases.residence_town = residenceTown
      aliases.birth_state = birthState
      aliases.birth_lga = birthLga
      aliases.issue_date = fmtDate(issueDate)
      // Fallback QR generation if missing
      if (!qrCode) {
        try {
          const payload = JSON.stringify({
            nin,
            surname: lastName,
            given_names: givenNames,
            dob: aliases.dob || src.birthdate || src.date_of_birth || src.dob || src.dateOfBirth || "",
            issue_date: issueDate,
          })
          const url = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(payload)}`
          const resp = await fetch(url)
          if (resp.ok) {
            const buf = Buffer.from(await resp.arrayBuffer())
            qrCode = `data:image/png;base64,${buf.toString("base64")}`
          }
        } catch { }
      }
      aliases.qr_code = qrCode
      aliases.email = email
      aliases.employment_status = employmentStatus
      aliases.marital_status = maritalStatus
      aliases.educational_level = educationalLevel
      aliases.birth_country = birthCountry
      aliases.height = height
      aliases.parent_first_name = parentFirstName
      aliases.spoken_language = spokenLanguage
      aliases.central_id = centralId
      aliases.nok_firstname = nokFirst
      aliases.nok_middlename = nokMiddle
      aliases.nok_surname = nokSurname
      aliases.nok_address1 = nokAddress1
      aliases.nok_address2 = nokAddress2
      aliases.nok_state = nokState
      aliases.nok_lga_town = nokLgaTown
      aliases.nok_postalcode = nokPostalCode
      try {
        const rawImage = src.image || src.photo || src.imageUrl || src.photoUrl || src.base64Image || src.image_base64 || src.imageBase64 || src.photo_base64 || src.photoBase64 || ""
        const rawPreview = typeof rawImage === "string" ? rawImage.slice(0, 120) : ""
        const finalPreview = typeof aliases.image === "string" ? String(aliases.image).slice(0, 120) : ""
        console.log("[PDF] NIN debug", {
          action,
          hasData: !!data,
          dataKeys: Object.keys(src || {}),
          rawImagePreview: rawPreview,
          finalImagePreview: finalPreview,
          hasQr: !!aliases.qr_code,
        })
      } catch { }
    } else if (action.startsWith("bvn.")) {
      const src = data || {}
      const firstName = src.first_name || src.firstName || ""
      const lastName = src.last_name || src.lastName || ""
      const middleName = src.middle_name || src.middleName || src.other_names || src.otherNames || src.middleName || ""
      const fullName = src.full_name || src.fullName || [firstName, middleName, lastName].filter(Boolean).join(" ")
      const bvn = src.bvn || src.number || src.bvn_number || ""
      const dob = src.date_of_birth || src.dob || src.birth_date || src.dateOfBirth || ""
      const phone = src.phone_number || src.phoneNumber || src.phoneNumber1 || src.phoneNumber2 || ""
      const gender = src.gender || src.sex || ""
      const email = src.email || ""
      const enrollmentBank = src.enrollment_bank || src.enrollmentBank || ""
      const enrollmentBranch = src.enrollment_branch || src.enrollmentBranch || ""
      const registrationDate = src.registration_date || src.registrationDate || ""
      const residentialAddress = src.residential_address || src.residentialAddress || ""
      const stateOfResidence = src.state_of_residence || src.stateOfResidence || ""
      const nin = src.nin || src.nin_number || src.ninNumber || ""
      let image = src.photo || src.photoUrl || src.image || src.imageUrl || ""
      if (!image && src.base64Image) {
        image = `data:image/jpeg;base64,${String(src.base64Image)}`
      }
      aliases.first_name = firstName
      aliases.middle_name = middleName
      aliases.last_name = lastName
      aliases.surname = lastName
      aliases.full_name = fullName
      aliases.bvn = bvn
      aliases.nin = nin
      aliases.dob = dob
      aliases.phone_number = phone
      aliases.phoneNumber = phone
      aliases.gender = gender
      aliases.email = email
      aliases.enrollment_bank = enrollmentBank
      aliases.enrollment_branch = enrollmentBranch
      aliases.registration_date = registrationDate
      aliases.residential_address = residentialAddress
      aliases.state_of_residence = stateOfResidence

      // Format Issue Date
      const today = new Date()
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
      aliases.issue_date = `${today.getDate().toString().padStart(2, "0")}-${months[today.getMonth()]}-${today.getFullYear()}`

      aliases.image = image
      aliases.base64Image = src.base64Image || ""
      aliases["data.bvn"] = bvn
      aliases["data.nin"] = nin
      aliases["data.firstName"] = firstName
      aliases["data.lastName"] = lastName
      aliases["data.middleName"] = middleName
      aliases["data.gender"] = gender
      aliases["data.email"] = email
      aliases["data.enrollmentBank"] = enrollmentBank
      aliases["data.enrollmentBranch"] = enrollmentBranch
      aliases["data.registrationDate"] = registrationDate
      aliases["data.residentialAddress"] = residentialAddress
      aliases["data.stateOfResidence"] = stateOfResidence
    } else if (action.startsWith("voters.")) {
      const src = data || {}
      const firstName = src.first_name || src.firstName || ""
      const lastName = src.last_name || src.lastName || ""
      const fullName = src.full_name || `${firstName} ${lastName}`.trim()
      const vin = src.number || src.votersCardNumber || src.vin || (params?.number || params?.vin || "")
      const dob = src.dob || src.date_of_birth || src.dateOfBirth || ""
      const gender = src.gender || src.sex || ""
      const state = src.state || src.residence_state || (params?.state || "")
      const lga = src.lga || src.residence_town || src.residence_lga || (params?.lga || "")
      let address = src.address || src.residential_address || ""
      if (!address) address = [lga, state].filter(Boolean).join(", ")
      let photo = src.photo || src.photoUrl || src.image || src.imageUrl || ""
      const looksLikeDataUrl2 = typeof photo === "string" && /^data:image\/(png|jpeg);base64,/i.test(String(photo))
      const looksLikeHttp2 = typeof photo === "string" && /^(https?:\/\/|\/)/i.test(String(photo))
      const base64Candidate2 = typeof photo === "string" && !looksLikeDataUrl2 && !looksLikeHttp2 && /^[A-Za-z0-9+/=]+$/.test(String(photo).trim()) && String(photo).length > 100
      if (base64Candidate2) photo = `data:image/jpeg;base64,${String(photo).trim()}`
      aliases.first_name = firstName
      aliases.last_name = lastName
      aliases.full_name = fullName
      aliases.vin = vin
      aliases.number = vin
      aliases.dob = dob
      aliases.gender = gender
      aliases.state = state
      aliases.lga = lga
      aliases.address = address
      aliases.photo = photo
    }

    // Common aliases
    aliases.generated_at = new Date().toLocaleString()
    let html = tpl.templateContent
    html = html.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_, key) => {
      const path = String(key)
      const val = path.split(".").reduce<any>((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), data)
        ?? (aliases[path] !== undefined ? aliases[path] : undefined)
      return (val !== undefined && val !== null) ? String(val) : ""
    })
    if (process.env.NODE_ENV !== "production") {
      try {
        console.log("[PDF] html has data:image", /data:image\/(png|jpeg|jpg);base64,/.test(html))
      } catch { }
    }

    // Normalize paths and relative asset URLs to absolute using request origin
    try {
      const origin = req.nextUrl?.origin || ""
      if (origin) {
        // Convert any backslashes to forward slashes in HTML paths
        html = html.replace(/\\+/g, "/")
        html = html.replace(/(<img\s+[^>]*src=["'])\/(?!\/)([^"']+)(["'][^>]*>)/gi, `$1${origin}/$2$3`)
      }
    } catch { }

    const pdf = await renderHtmlToPdfBuffer(html)
    const defaultBase = (() => {
      switch (String(action)) {
        case "bvn.retrieval_phone":
          return "bvn-by-phone-printout"
        case "bvn.printout":
          return "bvn-printout"
        default:
          return `${action}-slip`
      }
    })()
    const fname = (fileName && typeof fileName === "string" ? fileName : `${defaultBase}-${Date.now()}`).replace(/[^a-zA-Z0-9._-]+/g, "-")

    const pdfBody = (pdf instanceof Buffer) ? new Uint8Array(pdf) : pdf
    return new NextResponse(pdfBody as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fname}.pdf"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to generate PDF", detail: String(err?.message || err) }, { status: 500 })
  }
}
