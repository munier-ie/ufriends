import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/require-auth"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db"
import { renderHtmlToPdfBuffer } from "@/lib/pdf"

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req, { roles: [Role.ADMIN, Role.MARKETER] })
        if (!auth.ok) return auth.response

        const { searchParams } = new URL(req.url)
        const format = searchParams.get("format") || "csv" // csv or pdf
        const from = searchParams.get("from")
        const to = searchParams.get("to")

        // Fetch data (simplified for example, ideally reuse the analytics logic)
        // For now getting transactions as the base for the report
        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: {
                    gte: from ? new Date(from) : undefined,
                    lte: to ? new Date(to) : undefined,
                },
                status: "SUCCESS"
            },
            include: {
                user: { select: { email: true, profile: { select: { name: true } } } }
            },
            orderBy: { createdAt: "desc" },
            take: 1000 // Limit for export safety
        })

        if (format === "csv") {
            const csvHeader = "Date,Reference,User,Service,Amount,Status\n"
            const csvRows = transactions.map(t => {
                const date = t.createdAt.toISOString().split('T')[0]
                const user = t.user.profile?.name || t.user.email
                const service = t.category || t.type
                return `${date},${t.reference},"${user}",${service},${t.amount},${t.status}`
            }).join("\n")

            const csvContent = csvHeader + csvRows

            return new NextResponse(csvContent, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="report-${Date.now()}.csv"`
                }
            })
        } else if (format === "pdf") {
            // Generate HTML for PDF
            const totalRevenue = transactions.reduce((acc, t) => acc + Number(t.amount), 0)

            const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; }
            .summary { margin-bottom: 20px; padding: 10px; background: #fafafa; border: 1px solid #eee; }
          </style>
        </head>
        <body>
          <h1>UFriends Financial Report</h1>
          <div class="summary">
            <p><strong>Generated At:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Period:</strong> ${from || 'Start'} to ${to || 'Now'}</p>
            <p><strong>Total Transactions:</strong> ${transactions.length}</p>
            <p><strong>Total Revenue:</strong> ₦${totalRevenue.toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>User</th>
                <th>Service</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(t => `
                <tr>
                  <td>${t.createdAt.toISOString().slice(0, 10)}</td>
                  <td>${t.reference}</td>
                  <td>${t.user.profile?.name || t.user.email}</td>
                  <td>${t.category || t.type}</td>
                  <td>₦${Number(t.amount).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `

            const pdfBuffer = await renderHtmlToPdfBuffer(html)

            const pdfBody = (pdfBuffer instanceof Buffer) ? new Uint8Array(pdfBuffer) : pdfBuffer
            return new NextResponse(pdfBody as any, {
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="report-${Date.now()}.pdf"`
                }
            })
        }

        return NextResponse.json({ error: "Invalid format" }, { status: 400 })

    } catch (error) {
        console.error("Export failed", error)
        return NextResponse.json({ error: "Export failed" }, { status: 500 })
    }
}
