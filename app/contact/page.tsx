import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, Clock, MessageCircle, Headphones } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen crosshatch-bg">
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
              Get in <span className="text-primary">Touch</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
              Have questions or need support? We're here to help. Reach out to us through any of the channels below.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all">
                <CardContent className="p-6 text-center">
                  <Phone className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-3">Phone Support</h3>
                  <p className="text-muted-foreground mb-4">Speak directly with our support team</p>
                  <a href="tel:+2348001234567" className="text-primary hover:text-primary/80 font-medium">
                    +234-800-UFRIENDS
                  </a>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all">
                <CardContent className="p-6 text-center">
                  <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-3">Email Support</h3>
                  <p className="text-muted-foreground mb-4">Send us an email and we'll respond quickly</p>
                  <a href="mailto:support@ufriendsit.com" className="text-primary hover:text-primary/80 font-medium">
                    support@ufriendsit.com
                  </a>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-3">WhatsApp Chat</h3>
                  <p className="text-muted-foreground mb-4">Chat with us directly on WhatsApp</p>
                  <a
                    href="https://wa.me/2348001234567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Start WhatsApp Chat
                  </a>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-card-foreground">Send us a Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                            First Name
                          </Label>
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="John"
                            className="bg-input border-border focus:border-primary focus:ring-primary/20"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                            Last Name
                          </Label>
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Doe"
                            className="bg-input border-border focus:border-primary focus:ring-primary/20"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-foreground">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john.doe@example.com"
                          className="bg-input border-border focus:border-primary focus:ring-primary/20"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm font-medium text-foreground">
                          Subject
                        </Label>
                        <Input
                          id="subject"
                          type="text"
                          placeholder="How can we help you?"
                          className="bg-input border-border focus:border-primary focus:ring-primary/20"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm font-medium text-foreground">
                          Message
                        </Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us more about your inquiry..."
                          rows={5}
                          className="bg-input border-border focus:border-primary focus:ring-primary/20"
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Info & Hours */}
              <div className="space-y-8">
                <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                      <MapPin className="w-5 h-5 text-primary mr-2" />
                      Office Location
                    </h3>
                    <p className="text-muted-foreground">
                      123 Technology Drive
                      <br />
                      Victoria Island, Lagos
                      <br />
                      Nigeria
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                      <Clock className="w-5 h-5 text-primary mr-2" />
                      Support Hours
                    </h3>
                    <div className="space-y-2 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Monday - Friday:</span>
                        <span>24/7</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday - Sunday:</span>
                        <span>24/7</span>
                      </div>
                      <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                        <div className="flex items-center text-primary">
                          <Headphones className="w-4 h-4 mr-2" />
                          <span className="font-medium">24/7 Support Available</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-3">Need Immediate Help?</h3>
                    <p className="text-muted-foreground mb-4">
                      For urgent issues or account-related problems, use our WhatsApp chat or call our emergency support
                      line.
                    </p>
                    <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      <a href="https://wa.me/2348001234567" target="_blank" rel="noopener noreferrer">
                        Chat on WhatsApp
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
