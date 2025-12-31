"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { User, Bell, Shield, SettingsIcon, Save, Loader2 } from "lucide-react"
import { AdminPopupGuide } from "@/components/admin-popup-guide"
import { TwoFactorSetup } from "@/components/two-factor-setup"
import { authFetch } from "@/lib/client-auth"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)

  // Profile Settings
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  })

  // System Configuration
  const [systemConfig, setSystemConfig] = useState({
    appName: "UFriends Information Technology",
    maintenanceMode: false,
    defaultCurrency: "NGN",
    timezone: "Africa/Lagos",
    dateFormat: "DD/MM/YYYY",
    itemsPerPage: "20",
  })

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNewUser: true,
    emailNewOrder: true,
    emailDispute: true,
    smsNewOrder: false,
    smsDispute: true,
    pushNotifications: true,
  })

  // Security Settings
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  })

  // Floating Action Settings
  const [floatingActionConfig, setFloatingActionConfig] = useState({
    supportPhone: "",
    adminContacts: [] as { id: number; name: string; role: string; phone: string; initials: string }[],
  })

  // Load all settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [settingsRes, securityRes] = await Promise.all([
          authFetch("/api/admin/settings"),
          authFetch("/api/admin/settings/security"),
        ])

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          if (data.profile) setProfileData(data.profile)
          if (data.systemConfig) setSystemConfig(data.systemConfig)
          if (data.notifications) setNotifications(data.notifications)
          if (data.floatingActionConfig) setFloatingActionConfig(data.floatingActionConfig)
        }

        if (securityRes.ok) {
          const secData = await securityRes.json()
          setSecurityData((prev) => ({ ...prev, twoFactorEnabled: secData.twoFactorEnabled }))
        }
      } catch (err) {
        toast.error("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSaveProfile = async () => {
    try {
      const res = await authFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "profile", data: profileData }),
      })
      if (res.ok) {
        toast.success("Profile settings saved successfully!")
      } else {
        throw new Error("Failed to save")
      }
    } catch {
      toast.error("Failed to save profile")
    }
  }

  const handleSaveSystem = async () => {
    try {
      const res = await authFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "system", data: systemConfig }),
      })
      if (res.ok) {
        toast.success("System configuration saved successfully!")
        if (systemConfig.maintenanceMode) {
          toast.warning("Maintenance mode is now active. Users will see a maintenance page.")
        }
      } else {
        throw new Error("Failed to save")
      }
    } catch {
      toast.error("Failed to save system settings")
    }
  }

  const handleSaveNotifications = async () => {
    try {
      const res = await authFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "notifications", data: notifications }),
      })
      if (res.ok) {
        toast.success("Notification settings saved successfully!")
      } else {
        throw new Error("Failed to save")
      }
    } catch {
      toast.error("Failed to save notification settings")
    }
  }

  const handleSaveFloatingAction = async () => {
    try {
      const res = await authFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "floating_action", data: floatingActionConfig }),
      })
      if (res.ok) {
        toast.success("Floating action settings saved successfully!")
      } else {
        throw new Error("Failed to save")
      }
    } catch {
      toast.error("Failed to save floating action settings")
    }
  }

  const handleChangePassword = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error("Passwords do not match!")
      return
    }
    if (securityData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters!")
      return
    }

    try {
      const res = await authFetch("/api/admin/settings/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "changePassword",
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Password changed successfully!")
        setSecurityData({
          ...securityData,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        toast.error(data.error || "Failed to change password")
      }
    } catch {
      toast.error("Failed to change password")
    }
  }

  const handleToggle2FA = async (enabled: boolean) => {
    try {
      const res = await authFetch("/api/admin/settings/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle2FA", enable2FA: enabled }),
      })
      if (res.ok) {
        setSecurityData({ ...securityData, twoFactorEnabled: enabled })
        toast.success(`Two-factor authentication ${enabled ? "enabled" : "disabled"}!`)
      } else {
        throw new Error("Failed")
      }
    } catch {
      toast.error("Failed to update 2FA settings")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your admin account and system preferences</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-5">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="contact-settings" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            Contact Settings
          </TabsTrigger>
          <TabsTrigger value="popup-messages" className="gap-2">
            <Bell className="h-4 w-4" />
            Popup Messages
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileData.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
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
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
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
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Configuration */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Configure general system settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input
                    id="appName"
                    value={systemConfig.appName}
                    onChange={(e) => setSystemConfig({ ...systemConfig, appName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select
                    value={systemConfig.defaultCurrency}
                    onValueChange={(value) => setSystemConfig({ ...systemConfig, defaultCurrency: value })}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={systemConfig.timezone}
                    onValueChange={(value) => setSystemConfig({ ...systemConfig, timezone: value })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={systemConfig.dateFormat}
                    onValueChange={(value) => setSystemConfig({ ...systemConfig, dateFormat: value })}
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemsPerPage">Items Per Page</Label>
                  <Select
                    value={systemConfig.itemsPerPage}
                    onValueChange={(value) => setSystemConfig({ ...systemConfig, itemsPerPage: value })}
                  >
                    <SelectTrigger id="itemsPerPage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Maintenance Mode */}
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance" className="text-base">
                    Maintenance Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable maintenance mode to prevent users from accessing the platform
                  </p>
                </div>
                <Switch
                  id="maintenance"
                  checked={systemConfig.maintenanceMode}
                  onCheckedChange={(checked) => setSystemConfig({ ...systemConfig, maintenanceMode: checked })}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSystem} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications about platform activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNewUser" className="text-base">
                        New User Registration
                      </Label>
                      <p className="text-sm text-muted-foreground">Get notified when a new user registers</p>
                    </div>
                    <Switch
                      id="emailNewUser"
                      checked={notifications.emailNewUser}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailNewUser: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNewOrder" className="text-base">
                        New Service Request
                      </Label>
                      <p className="text-sm text-muted-foreground">Get notified when a new service is requested</p>
                    </div>
                    <Switch
                      id="emailNewOrder"
                      checked={notifications.emailNewOrder}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailNewOrder: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailDispute" className="text-base">
                        New Dispute
                      </Label>
                      <p className="text-sm text-muted-foreground">Get notified when a dispute is filed</p>
                    </div>
                    <Switch
                      id="emailDispute"
                      checked={notifications.emailDispute}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailDispute: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* SMS Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">SMS Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="smsNewOrder" className="text-base">
                        New Service Request
                      </Label>
                      <p className="text-sm text-muted-foreground">Receive SMS for new service requests</p>
                    </div>
                    <Switch
                      id="smsNewOrder"
                      checked={notifications.smsNewOrder}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, smsNewOrder: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="smsDispute" className="text-base">
                        New Dispute
                      </Label>
                      <p className="text-sm text-muted-foreground">Receive SMS for new disputes</p>
                    </div>
                    <Switch
                      id="smsDispute"
                      checked={notifications.smsDispute}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, smsDispute: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Push Notifications */}
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="pushNotifications" className="text-base">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Enable browser push notifications</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Settings */}
        <TabsContent value="contact-settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Floating Action & Support Settings</CardTitle>
              <CardDescription>Update the phone numbers and contacts shown in the user dashboard floating icon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Primary Support WhatsApp (e.g. 2348012345678)</Label>
                  <Input
                    id="supportPhone"
                    value={floatingActionConfig.supportPhone}
                    onChange={(e) => setFloatingActionConfig({ ...floatingActionConfig, supportPhone: e.target.value })}
                    placeholder="234..."
                  />
                  <p className="text-xs text-muted-foreground">This number is used for the "Support Chat" button.</p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Admin Contacts</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newId = (floatingActionConfig.adminContacts.length > 0 ? Math.max(...floatingActionConfig.adminContacts.map(c => c.id)) : 0) + 1
                        setFloatingActionConfig({
                          ...floatingActionConfig,
                          adminContacts: [
                            ...floatingActionConfig.adminContacts,
                            { id: newId, name: "New Admin", role: "Support", phone: "", initials: "NA" }
                          ]
                        })
                      }}
                    >
                      Add Admin Contact
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {floatingActionConfig.adminContacts.map((contact, index) => (
                      <div key={contact.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg relative group">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={contact.name}
                            onChange={(e) => {
                              const newContacts = [...floatingActionConfig.adminContacts]
                              newContacts[index].name = e.target.value
                              newContacts[index].initials = e.target.value.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                              setFloatingActionConfig({ ...floatingActionConfig, adminContacts: newContacts })
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Input
                            value={contact.role}
                            onChange={(e) => {
                              const newContacts = [...floatingActionConfig.adminContacts]
                              newContacts[index].role = e.target.value
                              setFloatingActionConfig({ ...floatingActionConfig, adminContacts: newContacts })
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone (WhatsApp)</Label>
                          <Input
                            value={contact.phone}
                            onChange={(e) => {
                              const newContacts = [...floatingActionConfig.adminContacts]
                              newContacts[index].phone = e.target.value
                              setFloatingActionConfig({ ...floatingActionConfig, adminContacts: newContacts })
                            }}
                          />
                        </div>
                        <div className="flex items-end pb-1 lg:justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newContacts = floatingActionConfig.adminContacts.filter(c => c.id !== contact.id)
                              setFloatingActionConfig({ ...floatingActionConfig, adminContacts: newContacts })
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveFloatingAction} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Popup Messages Settings */}
        <TabsContent value="popup-messages" className="space-y-6">
          <AdminPopupGuide />
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-1">
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
                  <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={securityData.confirmPassword}
                    onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleChangePassword} className="gap-2">
                  <Save className="h-4 w-4" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <TwoFactorSetup />
        </TabsContent>
      </Tabs>
    </div>
  )
}
