"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface PinPromptProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (pin: string) => void
    isLoading?: boolean
}

export function PinPrompt({ isOpen, onClose, onConfirm, isLoading }: PinPromptProps) {
    const [pin, setPin] = useState("")

    const handleConfirm = () => {
        if (pin.length !== 4) {
            toast.error("Please enter a 4-digit PIN")
            return
        }
        onConfirm(pin)
        setPin("")
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Enter Transaction PIN</DialogTitle>
                    <DialogDescription>
                        Please enter your 4-digit transaction PIN to authorize this request.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="pin" className="text-center block">PIN</Label>
                        <Input
                            id="pin"
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                            className="text-center text-2xl tracking-[1em]"
                            placeholder="••••"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleConfirm()
                            }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={isLoading || pin.length !== 4} className="bg-[#3457D5]">
                        {isLoading ? "Verifying..." : "Confirm PIN"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
