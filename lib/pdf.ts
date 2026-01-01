import { PDFOptions } from "puppeteer-core"
import chromium from "@sparticuz/chromium"
import puppeteerCore from "puppeteer-core"

export type RenderPdfOptions = PDFOptions & {
  baseUrl?: string
}

export async function renderHtmlToPdfBuffer(html: string, opts: RenderPdfOptions = {}): Promise<Buffer> {
  let browser = null
  try {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      // Production / Vercel: Use sparticuz/chromium
      // Configure sparticuz options if needed (e.g. graphics)
      chromium.setGraphicsMode = false
      browser = await puppeteerCore.launch({
        args: (chromium as any).args,
        defaultViewport: (chromium as any).defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: (chromium as any).headless,
        ignoreHTTPSErrors: true,
      } as any)
    } else {
      // Local development: Use standard puppeteer
      const puppeteer = await import("puppeteer").then((m) => m.default)
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
    }

    const page = await browser.newPage()

    // Allow relative asset URLs (e.g., /assets/logo.png)
    const base = opts.baseUrl || process.env.APP_BASE_URL || "http://localhost:5070"
    let htmlToRender = html
    if (/<head[^>]*>/i.test(htmlToRender)) {
      htmlToRender = htmlToRender.replace(/<head[^>]*>/i, (m) => `${m}<base href="${base}">`)
    } else {
      htmlToRender = `<!DOCTYPE html><html><head><base href="${base}"><meta charset=\"utf-8\"></head><body>${html}</body></html>`
    }

    await page.setContent(htmlToRender, { waitUntil: ["load", "networkidle0"], timeout: 30000 })

    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: "24px", right: "24px", bottom: "24px", left: "24px" },
      ...opts,
    })

    await page.close()
    return Buffer.from(pdf)
  } finally {
    if (browser) await browser.close()
  }
}
