import puppeteer, { PDFOptions } from "puppeteer"

export type RenderPdfOptions = PDFOptions & {
  baseUrl?: string
}

export async function renderHtmlToPdfBuffer(html: string, opts: RenderPdfOptions = {}): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-zygote",
      "--no-first-run",
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  })

  try {
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
    await browser.close()
  }
}
