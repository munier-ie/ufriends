import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Adebayo Johnson",
    role: "Small Business Owner",
    content:
      "UFriends IT has transformed how I manage my business finances. The bill payment feature saves me hours every month, and the transaction speeds are incredible. Highly recommended!",
    rating: 5,
    avatar: "/professional-african-man-business-owner.jpg",
  },
  {
    name: "Fatima Abdullahi",
    role: "Freelance Designer",
    content:
      "As a freelancer, I need reliable financial services. UFriends IT delivers every time. The airtime and data purchases are seamless, and their customer support is outstanding.",
    rating: 5,
    avatar: "/professional-african-woman-designer.jpg",
  },
  {
    name: "Chinedu Okafor",
    role: "Tech Entrepreneur",
    content:
      "The BVN and NIN services made setting up my startup so much easier. UFriends IT's platform is intuitive, secure, and incredibly efficient. It's a game-changer for Nigerian businesses.",
    rating: 5,
    avatar: "/professional-african-man-entrepreneur-tech.jpg",
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 lg:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            What Our <span className="text-primary">Customers Say</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Don't just take our word for it. Here's what real customers have to say about their experience with UFriends
            IT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <blockquote className="text-muted-foreground mb-6 leading-relaxed text-pretty">
                  "{testimonial.content}"
                </blockquote>

                <div className="flex items-center space-x-4">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6">Ready to join thousands of satisfied customers?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="bg-card/80 backdrop-blur-sm rounded-lg px-6 py-3 border border-border/50">
              <div className="text-2xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">Happy Customers</div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-lg px-6 py-3 border border-border/50">
              <div className="text-2xl font-bold text-primary">₦2B+</div>
              <div className="text-sm text-muted-foreground">Processed Safely</div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-lg px-6 py-3 border border-border/50">
              <div className="text-2xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime Record</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
