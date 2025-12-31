import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import { Footer } from "@/components/footer"

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-foreground mb-6">Privacy Policy</h1>

          <div className="prose prose-gray max-w-none text-foreground">
            <p className="text-muted-foreground mb-4">
              <strong>Effective Date:</strong> September 4, 2025
              <br />
              <strong>Company:</strong> UFriends Information Technology
              <br />
              <strong>Website:</strong> https://ufriends.com.ng
            </p>

            <p className="mb-6">
              At UFriends Information Technology, we are committed to protecting the privacy and security of our
              customers, agents, and partners. This Privacy Policy explains how we collect, use, disclose, and safeguard
              your personal information in compliance with the Nigeria Data Protection Regulation (NDPR), the Nigeria
              Data Protection Act 2023, and all applicable laws.
            </p>

            <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">We may collect:</p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>
                <strong>Identity Data:</strong> Name, date of birth, gender, NIN, BVN.
              </li>
              <li>
                <strong>Corporate Data:</strong> CAC certificate, business name, RC/BN number.
              </li>
              <li>
                <strong>Facial Data:</strong> Photos for onboarding and verification.
              </li>
              <li>
                <strong>Contact Data:</strong> Phone number, email, address.
              </li>
              <li>
                <strong>Usage Data:</strong> Transaction logs, dashboard activities.
              </li>
              <li>
                <strong>Consent Records:</strong> User agreements and approvals.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">2. Purpose of Data Collection</h2>
            <p className="mb-4">Your data is collected and processed for:</p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Customer onboarding and identity verification</li>
              <li>BVN/NIN enrollment and modification</li>
              <li>POS and agent banking enrollment</li>
              <li>Corporate verification and CAC registration</li>
              <li>Fraud prevention and compliance reporting</li>
              <li>Service improvement and support</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">3. Lawful Basis for Processing</h2>
            <p className="mb-4">We process your personal data only:</p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>With your explicit consent</li>
              <li>To comply with legal and regulatory obligations</li>
              <li>To protect our business interests and prevent fraud</li>
              <li>To deliver services you request</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">4. Restrictions and Prohibited Use</h2>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Verifying an individual without their consent is strictly prohibited.</li>
              <li>Attempting to verify politically exposed persons (PEPs) without lawful grounds will be reported.</li>
              <li>UFriends services must only be used for lawful, authorized purposes.</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">5. Data Security</h2>
            <p className="mb-6">
              We implement strong safeguards (encryption, access controls, monitoring) to prevent unauthorized access,
              alteration, or disclosure of personal data.
            </p>

            <h2 className="text-xl font-semibold mb-4">6. Data Retention</h2>
            <p className="mb-6">
              We retain your personal information only as long as necessary for the stated purposes or as required by
              law.
            </p>

            <h2 className="text-xl font-semibold mb-4">7. Disclosure of Information</h2>
            <p className="mb-4">We do not sell or rent your personal data. Information may be disclosed:</p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>To regulators or law enforcement as required</li>
              <li>To trusted partners under confidentiality agreements</li>
              <li>In case of legal disputes or fraud investigation</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">8. International Transfers</h2>
            <p className="mb-6">
              If data is transferred outside Nigeria, we ensure safeguards aligned with GDPR and global best practices.
            </p>

            <h2 className="text-xl font-semibold mb-4">9. Data Breach Protocol</h2>
            <p className="mb-6">
              In the unlikely event of a breach, affected users will be notified within 72 hours with corrective
              actions.
            </p>

            <h2 className="text-xl font-semibold mb-4">10. Children's Privacy</h2>
            <p className="mb-6">
              Our services are not directed to individuals under 18. We do not knowingly collect data from children.
            </p>

            <h2 className="text-xl font-semibold mb-4">11. Your Rights</h2>
            <p className="mb-4">Under NDPR & NDP Act, you have the right to:</p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Access your personal data</li>
              <li>Correct or update inaccurate data</li>
              <li>Withdraw consent at any time</li>
              <li>Request deletion of data</li>
              <li>Report misuse to the Nigeria Data Protection Bureau (NDPB)</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">12. End-Product Disclaimer</h2>
            <p className="mb-6">
              Verification slips or digital records generated from UFriends are{" "}
              <strong>not original government-issued documents</strong>
              and must not be used as such.
            </p>

            <h2 className="text-xl font-semibold mb-4">13. Updates to this Policy</h2>
            <p className="mb-6">
              We may update this Privacy Policy from time to time. Any changes will be communicated on our website.
            </p>

            <h2 className="text-xl font-semibold mb-4">14. Contact Us</h2>
            <p className="mb-6">
              For inquiries or data protection concerns, contact:
              <br />📧 support@ufriends.com.ng
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
