"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useSiteContent } from "@/hooks/useSiteContent"

export function CtaSection() {
  const { content } = useSiteContent()
  const cta = content.cta
  const hero = content.hero

  return (
    <section className="py-20 lg:py-32 bg-primary/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
          {cta.title} <span className="text-primary">{cta.titleHighlight}</span>
        </h2>
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
          {cta.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6">
            <Link href="/signup">
              {cta.primaryButtonText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          {hero.downloadAppUrl ? (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
            >
              <a href={hero.downloadAppUrl} target="_blank" rel="noopener noreferrer">
                {cta.secondaryButtonText}
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
            >
              {cta.secondaryButtonText}
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm text-muted-foreground">
          {cta.badges.map((badge, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className={`w-2 h-2 bg-${badge.color}-500 rounded-full`}></div>
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
