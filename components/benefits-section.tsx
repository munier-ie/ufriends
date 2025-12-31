import { Shield, Zap, Clock, HeadphonesIcon } from "lucide-react"

const benefits = [
  {
    icon: Shield,
    title: "Bank-Level Security",
    description:
      "Your transactions are protected with advanced encryption and multi-layer security protocols, ensuring your financial data stays safe.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Experience instant transactions and real-time processing. No more waiting hours or days for your payments to go through.",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description:
      "Access all our services anytime, anywhere. Our platform never sleeps, so you can manage your finances around the clock.",
  },
  {
    icon: HeadphonesIcon,
    title: "Expert Support",
    description:
      "Get help when you need it with our dedicated customer support team. We're here to assist you every step of the way.",
  },
]

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Why Choose <span className="text-primary">UFriends IT</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            We're committed to providing you with the best financial technology experience through innovation, security,
            and exceptional service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon
            return (
              <div key={index} className="text-center group hover:scale-105 transition-transform duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-pretty">{benefit.description}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-primary/5 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">Join Over 50,000 Satisfied Customers</h3>
            <p className="text-muted-foreground mb-6">
              Experience the difference with UFriends IT's comprehensive financial technology platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-yellow-400 rounded-full"></div>
                ))}
                <span className="ml-2 text-sm font-medium text-foreground">4.9/5 Rating</span>
              </div>
              <div className="text-sm text-muted-foreground">Based on 2,500+ reviews</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
