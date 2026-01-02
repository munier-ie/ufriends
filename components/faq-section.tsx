"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useSiteContent } from "@/hooks/useSiteContent"

export function FaqSection() {
  const { content } = useSiteContent()
  const faqs = content.faqs
  const contact = content.contact

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
                  <span className="text-muted-foreground">{contact.supportHours} Support Available</span>
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
                  href={`mailto:${contact.email}`}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  {contact.email}
                </a>
                <a href={contact.phoneHref} className="text-primary hover:text-primary/80 text-sm font-medium">
                  {contact.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
