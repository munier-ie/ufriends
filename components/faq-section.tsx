import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "How secure are my transactions on UFriends IT?",
    answer:
      "We use bank-level security with 256-bit SSL encryption, multi-factor authentication, and comply with international security standards. All transactions are monitored 24/7 for fraud prevention, and your personal information is never shared with third parties.",
  },
  {
    question: "What are the transaction limits and fees?",
    answer:
      "Transaction limits vary by service type and account verification level. Basic accounts have daily limits of ₦500,000, while verified accounts can transact up to ₦5,000,000 daily. Our fees are competitive and transparent - airtime purchases have no fees, while bill payments have a flat ₦50 convenience fee.",
  },
  {
    question: "How long do transactions take to process?",
    answer:
      "Most transactions are processed instantly, including airtime purchases, data bundles, and bill payments. Bank transfers typically take 1-5 minutes, while BVN and NIN verification services are completed within 24 hours during business days.",
  },
  {
    question: "Can I get a refund if something goes wrong?",
    answer:
      "Yes, we have a comprehensive refund policy. Failed transactions are automatically reversed within 24 hours. For service-related issues, contact our support team with your transaction reference, and we'll resolve it within 48 hours. Refunds for successful transactions depend on the service provider's policy.",
  },
  {
    question: "Do you offer customer support?",
    answer:
      "Our customer support team is available 24/7 through multiple channels: in-app chat, email (support@ufriendsit.com), phone (+234-800-UFRIENDS), and WhatsApp. We also have a comprehensive help center with guides and tutorials.",
  },
  {
    question: "How do I verify my account for higher limits?",
    answer:
      "Account verification is simple and secure. Upload a valid government-issued ID (NIN, driver's license, or passport), provide your BVN, and take a selfie for identity confirmation. Verification typically takes 2-4 hours during business days and unlocks higher transaction limits and premium features.",
  },
  {
    question: "Can I use UFriends IT for business transactions?",
    answer:
      "Yes! We offer specialized business accounts with features like bulk payments, invoice generation, expense tracking, and dedicated account managers. Business accounts have higher transaction limits and access to our API for integration with your existing systems.",
  },
  {
    question: "Is there a mobile app available?",
    answer:
      "Yes, our mobile app is available for both iOS and Android devices. Download it from the App Store or Google Play Store. The app offers all web platform features plus biometric login, push notifications, and offline transaction history viewing.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Content - FAQ Illustration */}
          <div className="relative">
            <div className="text-center lg:text-left mb-8 lg:mb-0">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
                Frequently Asked <span className="text-primary">Questions</span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 text-pretty">
                Got questions? We've got answers. Find everything you need to know about using UFriends IT.
              </p>
            </div>

            {/* FAQ Illustration */}
            <div className="relative max-w-md mx-auto lg:mx-0">
              <img
                src="/faq-illustration-customer-support.jpg"
                alt="Customer support illustration"
                className="w-full h-auto rounded-2xl shadow-lg"
              />

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">?</span>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-secondary-foreground text-lg font-bold">!</span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center lg:text-left">
              <p className="text-muted-foreground mb-4">Still have questions?</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">24/7 Support Available</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-muted-foreground">Average Response: 2 minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - FAQ Accordion */}
          <div className="space-y-4">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg px-6 hover:shadow-md transition-all"
                >
                  <AccordionTrigger className="text-left font-semibold text-card-foreground hover:text-primary py-6 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-pretty">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-semibold text-foreground mb-2">Need More Help?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Our support team is ready to assist you with any questions or concerns.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="mailto:support@ufriendsit.com"
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  support@ufriendsit.com
                </a>
                <a href="tel:+2348001234567" className="text-primary hover:text-primary/80 text-sm font-medium">
                  +234-800-UFRIENDS
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
