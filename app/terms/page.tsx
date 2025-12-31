import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import { Footer } from "@/components/footer"

export default function TermsPage() {
  return (
    <div className="min-h-screen crosshatch-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="flex items-center space-x-2 mb-6">
            <Image src="/ufriend-logo.png" alt="UFriends Logo" width={32} height={32} className="w-8 h-8" />
            <span className="font-bold text-xl text-foreground">UFriends IT</span>
          </div>
        </div>

        <div className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">Terms of Service</h1>

          <div className="prose prose-gray max-w-none text-foreground">
            <p className="text-muted-foreground mb-4">
              <strong>Effective Date:</strong> September 4, 2025
              <br />
              <strong>Company:</strong> UFriends Information Technology ("UFriends", "we", "our", "us")
              <br />
              <strong>Website:</strong> https://ufriends.com.ng
            </p>

            <p className="mb-6">
              These Terms of Service govern your use of UFriends' identity verification and digital services. By
              accessing or using our website and services, you agree to these Terms.
            </p>

            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-6">
              By accessing UFriends, you agree to comply with these Terms and applicable Nigerian laws. If you do not
              agree, do not use our services.
            </p>

            <h2 className="text-xl font-semibold mb-4">2. Services Provided</h2>
            <p className="mb-4">We provide lawful services including (but not limited to):</p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>BVN & NIN verification and enrollment</li>
              <li>CAC registration and retrieval</li>
              <li>POS agent onboarding & agency banking</li>
              <li>Airtime, data, and bill payments</li>
              <li>Education services (WAEC, NECO, JAMB, etc.)</li>
              <li>Software development & integration</li>
              <li>Customer identity and compliance verification</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">3. User Eligibility</h2>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>You must be at least 18 years old.</li>
              <li>Services must only be used for lawful and authorized purposes.</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">4. User Consent</h2>
            <p className="mb-6">
              Verification requires explicit and informed consent of the individual. Users must confirm they have
              obtained consent before initiating verification.
            </p>

            <h2 className="text-xl font-semibold mb-4">5. Authorized Uses</h2>
            <p className="mb-4">Services may only be used for:</p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Customer due diligence (KYC)</li>
              <li>Employment background checks (with consent)</li>
              <li>Financial onboarding and fraud prevention</li>
              <li>Regulatory compliance and lawful identity confirmation</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">6. Prohibited Uses</h2>
            <p className="mb-4">You must not:</p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Verify individuals without consent</li>
              <li>Misrepresent verification results as government-issued documents</li>
              <li>Attempt to verify PEPs without lawful justification</li>
              <li>Use services for fraud, harassment, or unlawful activity</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">7. Payments & Refunds</h2>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Payments must be made via approved methods.</li>
              <li>
                Refunds are not guaranteed once a service request has been processed, except in cases of system error.
              </li>
              <li>Failed transactions will be reviewed and resolved within 7 business days.</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">8. Service Availability</h2>
            <p className="mb-6">
              We strive for uptime but services may be unavailable due to maintenance, third-party downtime, or
              regulatory updates.
            </p>

            <h2 className="text-xl font-semibold mb-4">9. Accuracy of Information</h2>
            <p className="mb-6">
              You are responsible for providing accurate and lawful information. UFriends will not be liable for errors
              arising from false or incomplete data.
            </p>

            <h2 className="text-xl font-semibold mb-4">10. Data Protection & Privacy</h2>
            <p className="mb-6">
              We process all data lawfully under NDPR and the Nigeria Data Protection Act 2023. See our Privacy Policy
              for details.
            </p>

            <h2 className="text-xl font-semibold mb-4">11. Security Obligations</h2>
            <p className="mb-6">
              You must not tamper with, hack, or misuse UFriends' systems. Any breach may result in suspension and
              reporting to authorities.
            </p>

            <h2 className="text-xl font-semibold mb-4">12. User Accounts</h2>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Keep login credentials secure.</li>
              <li>You are responsible for all activities under your account.</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">13. Intellectual Property</h2>
            <p className="mb-6">
              All content, branding, software, and logos on UFriends are the property of UFriends Information
              Technology. Unauthorized use is prohibited.
            </p>

            <h2 className="text-xl font-semibold mb-4">14. Indemnity</h2>
            <p className="mb-6">
              You agree to indemnify and hold harmless UFriends, its directors, and affiliates against claims or damages
              from misuse of services.
            </p>

            <h2 className="text-xl font-semibold mb-4">15. Limitation of Liability</h2>
            <p className="mb-6">
              UFriends is not liable for indirect, incidental, or consequential damages arising from use of its
              services.
            </p>

            <h2 className="text-xl font-semibold mb-4">16. Suspension or Termination</h2>
            <p className="mb-6">
              We may suspend or terminate your access if you violate these Terms, engage in fraud, or breach laws.
            </p>

            <h2 className="text-xl font-semibold mb-4">17. Dispute Resolution</h2>
            <p className="mb-6">
              Any dispute shall first be settled amicably. If unresolved, disputes shall be referred to arbitration
              under Nigerian law.
            </p>

            <h2 className="text-xl font-semibold mb-4">18. Governing Law</h2>
            <p className="mb-6">These Terms are governed by the laws of the Federal Republic of Nigeria.</p>

            <h2 className="text-xl font-semibold mb-4">19. Updates to Terms</h2>
            <p className="mb-6">We may revise these Terms periodically. Updates will be posted on our website.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
