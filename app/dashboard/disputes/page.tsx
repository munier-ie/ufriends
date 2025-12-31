"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { authFetch } from "@/lib/client-auth"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"

interface Dispute {
    id: string
    service: string
    reference?: string
    issue: string
    status: string
    createdAt: string
    adminNotes?: string
}

export default function UserDisputesPage() {
    const [disputes, setDisputes] = useState<Dispute[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Form state
    const [service, setService] = useState("")
    const [issue, setIssue] = useState("")
    const [reference, setReference] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [recentTransactions, setRecentTransactions] = useState<any[]>([])
    const [loadingTransactions, setLoadingTransactions] = useState(false)
    const [isManualRef, setIsManualRef] = useState(false)

    const fetchDisputes = async () => {
        try {
            const res = await authFetch("/api/disputes")
            const data = await res.json()
            if (data.ok) {
                setDisputes(data.data)
            }
        } catch (error) {
            console.error("Failed to fetch disputes", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDisputes()
    }, [])

    useEffect(() => {
        if (!service) {
            setRecentTransactions([])
            return
        }

        const loadTx = async () => {
            setLoadingTransactions(true)
            try {
                const res = await authFetch(`/api/user/transactions/recent?category=${service}`)
                const data = await res.json()
                if (data.ok) {
                    setRecentTransactions(data.data)
                    // If switching categories, reset reference unless it's manual mode? 
                    // Better to reset to force selection from new category or manual entry
                    if (!isManualRef) setReference("")
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoadingTransactions(false)
            }
        }
        loadTx()
    }, [service])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await authFetch("/api/disputes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ service, issue, reference }),
            })

            if (res.ok) {
                setIsDialogOpen(false)
                setService("")
                setIssue("")
                setReference("")
                setIsManualRef(false)
                fetchDisputes()
            } else {
                alert("Failed to create dispute")
            }
        } catch (error) {
            console.error("Failed to submit dispute", error)
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "RESOLVED":
                return <Badge className="bg-green-600">Resolved</Badge>
            case "OPEN":
                return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Open</Badge>
            case "IN_PROGRESS":
                return <Badge variant="outline" className="border-blue-500 text-blue-500">In Progress</Badge>
            case "ESCALATED":
                return <Badge variant="destructive">Escalated</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="container py-8 max-w-6xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Dispute Center</h1>
                    <p className="text-muted-foreground">Track and manage your service complaints</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>Log a New Dispute</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Log a Service Dispute</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="service">Service Category</Label>
                                <Select value={service} onValueChange={setService} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Service" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BVN">BVN Services</SelectItem>
                                        <SelectItem value="NIN">NIN Services</SelectItem>
                                        <SelectItem value="CAC">CAC Registration</SelectItem>
                                        <SelectItem value="AIRTIME">Airtime</SelectItem>
                                        <SelectItem value="DATA">Data</SelectItem>
                                        <SelectItem value="BILLS">Bills</SelectItem>
                                        <SelectItem value="WALLET">Wallet/Payment</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="reference">Transaction</Label>
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="h-auto p-0 text-xs"
                                        onClick={() => {
                                            setIsManualRef(!isManualRef)
                                            setReference("")
                                        }}
                                    >
                                        {isManualRef ? "Select Transaction" : "Enter Reference Manually"}
                                    </Button>
                                </div>

                                {isManualRef ? (
                                    <Input
                                        id="reference"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        placeholder="e.g. TX-123456"
                                    />
                                ) : (
                                    <Select value={reference} onValueChange={setReference}>
                                        <SelectTrigger disabled={!service || loadingTransactions}>
                                            <SelectValue placeholder={
                                                loadingTransactions ? "Loading transactions..." :
                                                    !service ? "Select a service first" :
                                                        recentTransactions.length === 0 ? "No recent transactions found" :
                                                            "Select a transaction"
                                            } />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {recentTransactions.map(tx => (
                                                <SelectItem key={tx.id} value={tx.reference}>
                                                    <div className="flex flex-col text-left">
                                                        <span className="font-medium">{tx.subservice || tx.category} - ₦{Number(tx.amount).toLocaleString()}</span>
                                                        <span className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()} • {tx.reference} • {tx.status}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {recentTransactions.length === 0 && (
                                                <SelectItem value="none" disabled>No recent transactions</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                                <p className="text-[10px] text-muted-foreground">
                                    {!isManualRef && "Select the transaction related to your complaint."}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="issue">Issue Description</Label>
                                <Textarea
                                    id="issue"
                                    value={issue}
                                    onChange={(e) => setIssue(e.target.value)}
                                    placeholder="Describe your issue in detail..."
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Submitting..." : "Submit Dispute"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{disputes.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Detailed Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                {disputes.filter(d => d.status === 'OPEN').length} Open
                            </div>
                            <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                {disputes.filter(d => d.status === 'RESOLVED').length} Resolved
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>My Disputes</CardTitle>
                    <CardDescription>History of your reported issues</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Issue</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Admin Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">Loading disputes...</TableCell>
                                </TableRow>
                            ) : disputes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No disputes found.</TableCell>
                                </TableRow>
                            ) : (
                                disputes.map((dispute) => (
                                    <TableRow key={dispute.id}>
                                        <TableCell className="font-medium">
                                            {new Date(dispute.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{dispute.service}</TableCell>
                                        <TableCell className="font-mono text-xs">{dispute.reference || '—'}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={dispute.issue}>{dispute.issue}</TableCell>
                                        <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{dispute.adminNotes || '—'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
