"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { User, Bell, Shield, Save, Lock } from "lucide-react"
import { authFetch } from "@/lib/client-auth"

export default function SettingsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    }>
      <SettingsPage />
    </Suspense>
  )
}

function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("profile")

  // Profile Settings
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  })
  const [hasPin, setHasPin] = useState(false)

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsNotifications: false,
    inAppNotifications: true,
  })

  // Security Settings
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [pinData, setPinData] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  })

  useEffect(() => {
    setMounted(true)
    const tab = searchParams.get("tab")
    if (tab) setActiveTab(tab)

    const loadProfile = async () => {
      try {
        const res = await authFetch("/api/me")
        if (res.ok) {
          const data = await res.json()
          setProfileData({
            name: data.profile?.name || data.user?.profile?.name || "",
            email: data.user?.email || "",
            phone: data.profile?.phone || data.user?.profile?.phone || "",
            avatar: data.profile?.avatarUrl || "",
          })
          setHasPin(data.hasPin)
        }
      } catch (err) {
        console.error("Failed to load profile", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSaveProfile = async () => {
    try {
      const res = await authFetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
        }),
      })
      if (res.ok) {
        toast.success("Profile settings saved successfully!")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to save profile settings")
      }
    } catch (err) {
      toast.error("An error occurred while saving profile")
    }
  }

  const handleSaveNotifications = () => {
    toast.success("Notification settings saved successfully!")
    console.log("[v0] Notifications saved:", notifications)
  }

  const handleChangePassword = async () => {
    if (!securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword) {
      toast.error("Please fill in all password fields")
      return
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error("New passwords do not match!")
      return
    }

    if (securityData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters!")
      return
    }

    try {
      const res = await authFetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword,
        }),
      })

      if (res.ok) {
        toast.success("Password changed successfully!")
        setSecurityData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to change password")
      }
    } catch (err) {
      toast.error("An error occurred while changing password")
    }
  }

  const handleChangePin = async () => {
    if (!pinData.newPin || !pinData.confirmPin) {
      toast.error("Please fill in all PIN fields")
      return
    }

    if (pinData.newPin !== pinData.confirmPin) {
      toast.error("New PINs do not match!")
      return
    }

    if (pinData.newPin.length !== 4 || !/^\d+$/.test(pinData.newPin)) {
      toast.error("PIN must be exactly 4 digits!")
      return
    }

    try {
      const body: any = {
        newPin: pinData.newPin,
      }

      if (hasPin) {
        if (pinData.currentPin) {
          body.currentPin = pinData.currentPin
        } else {
          // Fallback to password or require PIN
          toast.error("Current PIN is required to change PIN")
          return
        }
      } else {
        // If first time, we might need a password field here or just assume they are logged in
        // For now, let's add a password field to the UI if hasPin is false or just require current password in the state
        if (securityData.currentPassword) {
          body.currentPassword = securityData.currentPassword
        } else {
          toast.error("Please enter your current password in the Security tab to verify your identity")
          return
        }
      }

      const res = await authFetch("/api/me/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success("Transaction PIN updated successfully!")
        setPinData({
          currentPin: "",
          newPin: "",
          confirmPin: "",
        })
        setHasPin(true)
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update PIN")
      }
    } catch (err) {
      toast.error("An error occurred while updating PIN")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security</p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="pin" className="gap-2">
            <Lock className="h-4 w-4" />
            {hasPin ? "Change PIN" : "Setup PIN"}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-[#3457D5] text-2xl text-white">
                      {profileData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                    <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleSaveProfile} className="bg-[#3457D5] text-white gap-2" type="button">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={securityData.currentPassword}
                      onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Password must be at least 8 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleChangePassword} className="bg-[#3457D5] text-white gap-2" type="button">
                    <Save className="h-4 w-4" />
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailAlerts" className="text-base">
                        Email Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">Receive email notifications for transactions</p>
                    </div>
                    <Switch
                      id="emailAlerts"
                      checked={notifications.emailAlerts}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="smsNotifications" className="text-base">
                        SMS Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">Receive SMS alerts for important updates</p>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, smsNotifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="inAppNotifications" className="text-base">
                        In-App Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">Show notifications within the app</p>
                    </div>
                    <Switch
                      id="inAppNotifications"
                      checked={notifications.inAppNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, inAppNotifications: checked })}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveNotifications} className="bg-[#3457D5] text-white gap-2">
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="pin">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>{hasPin ? "Change Transaction PIN" : "Setup Transaction PIN"}</CardTitle>
                <CardDescription>
                  {hasPin
                    ? "Update your 4-digit PIN for secure transactions"
                    : "Create a 4-digit PIN to secure your transactions"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  {hasPin ? (
                    <div className="space-y-2">
                      <Label htmlFor="currentPin">Current PIN</Label>
                      <Input
                        id="currentPin"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={pinData.currentPin}
                        onChange={(e) => setPinData({ ...pinData, currentPin: e.target.value.replace(/\D/g, "") })}
                        placeholder="Enter current PIN"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="verifyPassword">Current Password</Label>
                      <Input
                        id="verifyPassword"
                        type="password"
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                        placeholder="Verify your password to set PIN"
                      />
                      <p className="text-xs text-muted-foreground">
                        Required once to verify your identity for first-time PIN setup.
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="newPin">New PIN</Label>
                    <Input
                      id="newPin"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={pinData.newPin}
                      onChange={(e) => setPinData({ ...pinData, newPin: e.target.value.replace(/\D/g, "") })}
                      placeholder="Enter new 4-digit PIN"
                    />
                    <p className="text-xs text-muted-foreground">PIN must be exactly 4 digits</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPin">Confirm New PIN</Label>
                    <Input
                      id="confirmPin"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={pinData.confirmPin}
                      onChange={(e) => setPinData({ ...pinData, confirmPin: e.target.value.replace(/\D/g, "") })}
                      placeholder="Confirm new PIN"
                    />
                  </div>
                  <Button onClick={handleChangePin} className="bg-[#3457D5] text-white gap-2" type="button">
                    <Lock className="h-4 w-4" />
                    {hasPin ? "Update PIN" : "Create PIN"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
