"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ClipboardList, Download, ExternalLink, Eye, FileText, Image, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { authFetch } from "@/lib/client-auth"
import { toast } from "sonner"
import { ensureAbsoluteUrl } from "@/lib/utils"

interface ServiceRequest {
    id: string
    reference: string
    category: string
    subservice: string | null
    amount: number
    status: string
    adminNotes: string | null
    proofUrl: string | null
    meta: any
    createdAt: string
    updatedAt: string
}

export default function UserRequestsPage() {
    const [requests, setRequests] = useState<ServiceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("all")
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const query = statusFilter !== "all" ? `?status=${statusFilter}` : ""
            const res = await authFetch(`/api/me/requests${query}`)
            if (res.ok) {
                const data = await res.json()
                setRequests(data.data || [])
            } else {
                toast.error("Failed to load requests")
            }
        } catch (err) {
            toast.error("Failed to load requests")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [statusFilter])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "SUBMITTED":
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1" />Submitted</Badge>
            case "ONGOING":
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><RefreshCw className="w-3 h-3 mr-1" />Processing</Badge>
            case "SUCCESS":
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>
            case "REJECTED":
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
            case "CANCELLED":
                return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getProofIcon = (url: string) => {
        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return <Image className="w-4 h-4" />
        return <FileText className="w-4 h-4" />
    }

    const openDetails = (request: ServiceRequest) => {
        setSelectedRequest(request)
        setDetailsOpen(true)
    }

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 space-y-6"
        >
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">My Service Requests</h1>
                    <p className="text-muted-foreground">Track the status of your service requests and view completed proofs</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="SUBMITTED">Submitted</SelectItem>
                            <SelectItem value="ONGOING">Processing</SelectItem>
                            <SelectItem value="SUCCESS">Completed</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={fetchRequests} variant="outline" size="icon">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-[#3457D5]" />
                        Service Request History
                    </CardTitle>
                    <CardDescription>View all your service requests and their current status</CardDescription>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Requests Found</h3>
                            <p className="text-muted-foreground">You haven't made any service requests yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Proof</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell className="font-medium">
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {request.reference?.slice(0, 12)}...
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium uppercase">{request.category}</p>
                                                    {request.subservice && (
                                                        <p className="text-xs text-muted-foreground">{request.subservice}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                ₦{request.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                                            <TableCell>
                                                {request.proofUrl ? (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="text-[#3457D5] p-0 h-auto gap-1"
                                                        onClick={() => window.open(ensureAbsoluteUrl(request.proofUrl!), "_blank")}
                                                    >
                                                        {getProofIcon(request.proofUrl)}
                                                        View Proof
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openDetails(request)}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Request Details</DialogTitle>
                        <DialogDescription>
                            Reference: <span className="font-mono">{selectedRequest?.reference}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Service</p>
                                    <p className="font-medium">{selectedRequest.category}</p>
                                    {selectedRequest.subservice && (
                                        <p className="text-sm text-muted-foreground">{selectedRequest.subservice}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Amount</p>
                                    <p className="font-semibold">₦{selectedRequest.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Status</p>
                                    {getStatusBadge(selectedRequest.status)}
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Date</p>
                                    <p className="text-sm">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            {selectedRequest.adminNotes && (
                                <div className="bg-muted/50 rounded-lg p-4 border">
                                    <p className="text-xs text-muted-foreground uppercase mb-1">Admin Notes</p>
                                    <p className="text-sm">{selectedRequest.adminNotes}</p>
                                </div>
                            )}

                            {selectedRequest.proofUrl && (
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <p className="text-xs text-green-700 uppercase mb-2 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Proof of Completion
                                    </p>
                                    {selectedRequest.proofUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <div className="space-y-2">
                                            <img
                                                src={selectedRequest.proofUrl}
                                                alt="Proof"
                                                className="max-w-full rounded-lg border"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => window.open(ensureAbsoluteUrl(selectedRequest.proofUrl!), "_blank")}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Download Proof
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => window.open(ensureAbsoluteUrl(selectedRequest.proofUrl!), "_blank")}
                                        >
                                            {getProofIcon(selectedRequest.proofUrl)}
                                            <span className="ml-2">View/Download Proof</span>
                                            <ExternalLink className="w-4 h-4 ml-2" />
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Display submitted parameters */}
                            {selectedRequest.meta?.params && Object.keys(selectedRequest.meta.params).length > 0 && (
                                <div className="border rounded-lg p-4">
                                    <p className="text-xs text-muted-foreground uppercase mb-2">Your Submitted Details</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {Object.entries(selectedRequest.meta.params).map(([key, value]) => (
                                            <div key={key}>
                                                <p className="text-xs text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                                <p className="font-medium break-all">{String(value)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}
