"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
    ClipboardList,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    ExternalLink,
    MoreVertical,
    FileUp,
    AlertCircle,
    Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

type Request = {
    id: string
    reference: string
    userId: string
    category: string
    subservice: string | null
    amount: number
    status: string
    createdAt: string
    adminNotes: string | null
    proofUrl: string | null
    meta: any
    user: {
        email: string
        profile: {
            name: string
            phone: string
        } | null
    }
}

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
    const [actionDialogOpen, setActionDialogOpen] = useState(false)
    const [actionType, setActionType] = useState<"ONGOING" | "SUCCESS" | "REJECTED" | "CANCELLED" | null>(null)
    const [adminNotes, setAdminNotes] = useState("")
    const [proofUrl, setProofUrl] = useState("")
    const [updateLoading, setUpdateLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const query = new URLSearchParams()
            if (statusFilter !== "all") query.append("status", statusFilter)

            const res = await fetch(`/api/admin/requests?${query.toString()}`)
            const data = await res.json()
            if (data.data) {
                setRequests(data.data)
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to load requests", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [statusFilter])

    const handleUpdateStatus = async () => {
        if (!selectedRequest || !actionType) return

        setUpdateLoading(true)
        try {
            const res = await fetch("/api/admin/requests", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedRequest.id,
                    status: actionType,
                    adminNotes,
                    proofUrl
                })
            })

            if (res.ok) {
                toast({ title: "Success", description: `Request updated to ${actionType}` })
                setActionDialogOpen(false)
                fetchRequests()
            } else {
                const error = await res.json()
                throw new Error(error.error || "Failed to update")
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setUpdateLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "SUBMITTED": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Submitted</Badge>
            case "ONGOING": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Ongoing</Badge>
            case "SUCCESS": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>
            case "REJECTED": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
            case "CANCELLED": return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)

            const res = await fetch("/api/admin/requests/upload", {
                method: "POST",
                body: formData,
            })

            const data = await res.json()
            if (res.ok) {
                setProofUrl(data.fileUrl)
                toast({ title: "Success", description: `File uploaded: ${data.fileName}` })
            } else {
                toast({ title: "Error", description: data.error || "Upload failed", variant: "destructive" })
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to upload file", variant: "destructive" })
        } finally {
            setUploading(false)
        }
    }

    const renderParams = (params: any) => {
        if (!params) return <span className="text-muted-foreground italic text-xs">No parameters provided</span>

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                {Object.entries(params).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-sm font-medium break-all">{String(value)}</p>
                    </div>
                ))}
            </div>
        )
    }

    const filteredRequests = requests.filter(req =>
        req.reference.toLowerCase().includes(search.toLowerCase()) ||
        req.user.email.toLowerCase().includes(search.toLowerCase()) ||
        req.category.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-6 space-y-8 min-h-screen bg-[#F9F7F3]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#3457D5]">Service Requests</h1>
                    <p className="text-muted-foreground mt-1">Manage and track manual service executions</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={fetchRequests} variant="outline" className="bg-white">
                        Refresh
                    </Button>
                </div>
            </div>

            <Card className="border-[#CCCCFF]/30 shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-transparent border-b">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by reference, email, or service..."
                                className="pl-9 bg-white"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <select
                                className="bg-white border rounded-md h-10 px-3 text-sm focus:ring-2 ring-[#3457D5]/20 outline-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="SUBMITTED">Submitted</option>
                                <option value="ONGOING">Ongoing</option>
                                <option value="SUCCESS">Completed</option>
                                <option value="REJECTED">Rejected</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[150px]">Date & Ref</TableHead>
                                <TableHead>User / Email</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <Clock className="h-8 w-8 text-[#3457D5] animate-spin" />
                                            <span className="text-muted-foreground">Loading requests...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                                            <span className="text-muted-foreground">No requests found</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium text-sm">{new Date(req.createdAt).toLocaleDateString()}</div>
                                            <div className="text-[10px] text-muted-foreground font-mono">{req.reference}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium">{req.user.profile?.name || "No name"}</div>
                                            <div className="text-xs text-muted-foreground">{req.user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium uppercase">{req.category}</div>
                                            <div className="text-xs text-muted-foreground">{req.subservice || "N/A"}</div>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            ₦{req.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(req.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedRequest(req);
                                                        setActionType("ONGOING");
                                                        setAdminNotes(req.adminNotes || "");
                                                        setProofUrl(req.proofUrl || "");
                                                        setActionDialogOpen(true);
                                                    }}>
                                                        <Clock className="mr-2 h-4 w-4" /> Start Working
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-green-600" onClick={() => {
                                                        setSelectedRequest(req);
                                                        setActionType("SUCCESS");
                                                        setAdminNotes(req.adminNotes || "");
                                                        setProofUrl(req.proofUrl || "");
                                                        setActionDialogOpen(true);
                                                    }}>
                                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Complete
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600" onClick={() => {
                                                        setSelectedRequest(req);
                                                        setActionType("REJECTED");
                                                        setAdminNotes(req.adminNotes || "");
                                                        setProofUrl("");
                                                        setActionDialogOpen(true);
                                                    }}>
                                                        <XCircle className="mr-2 h-4 w-4" /> Reject
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-gray-600" onClick={() => {
                                                        setSelectedRequest(req);
                                                        setActionType("CANCELLED");
                                                        setAdminNotes(req.adminNotes || "");
                                                        setProofUrl("");
                                                        setActionDialogOpen(true);
                                                    }}>
                                                        <XCircle className="mr-2 h-4 w-4" /> Cancel
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === "ONGOING" && "Start Processing Request"}
                            {actionType === "SUCCESS" && "Complete Request"}
                            {actionType === "REJECTED" && "Reject Request"}
                            {actionType === "CANCELLED" && "Cancel Request"}
                        </DialogTitle>
                        <DialogDescription>
                            Action for reference: <span className="font-mono font-bold">{selectedRequest?.reference}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                        {/* Request Details Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-[#3457D5]" />
                                <h3 className="text-sm font-bold text-foreground font-sans">User Submitted Details</h3>
                            </div>
                            {renderParams(selectedRequest?.meta?.params)}
                        </div>

                        <DropdownMenuSeparator className="my-4" />

                        <div className="space-y-2">
                            <Label htmlFor="notes">Admin Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Message to the user..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground italic">Admin notes are visible to the user.</p>
                        </div>

                        {actionType === "SUCCESS" && (
                            <div className="space-y-2">
                                <Label>Proof of Completion</Label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <div className="flex gap-2">
                                    <Input
                                        id="proof"
                                        placeholder="https://... or upload a file"
                                        value={proofUrl}
                                        onChange={(e) => setProofUrl(e.target.value)}
                                    />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        title="Upload file"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <Clock className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <FileUp className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                {proofUrl && (
                                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span className="truncate">{proofUrl}</span>
                                    </div>
                                )}
                                <p className="text-[10px] text-muted-foreground">Enter a link OR upload image/PDF/Word/Excel file (max 10MB).</p>
                            </div>
                        )}

                        {(actionType === "REJECTED" || actionType === "CANCELLED") && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-md flex gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                                <p className="text-xs text-red-700">This will refund ₦{selectedRequest?.amount.toLocaleString()} back to the user's wallet.</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleUpdateStatus}
                            disabled={updateLoading}
                            className={
                                actionType === "SUCCESS" ? "bg-green-600 hover:bg-green-700" :
                                    actionType === "REJECTED" ? "bg-red-600 hover:bg-red-700" :
                                        "bg-[#3457D5]"
                            }
                        >
                            {updateLoading ? "Saving..." : "Confirm Action"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
