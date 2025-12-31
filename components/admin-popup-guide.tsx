"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"

export function AdminPopupGuide() {
  return (
    <div className="space-y-6">
      <Alert className="border-[#3457D5]/20 bg-[#CCCCFF]/10">
        <AlertCircle className="h-4 w-4 text-[#3457D5]" />
        <AlertDescription className="text-[#3457D5]">
          <strong>Dashboard Popup Messages:</strong> Admins can create and manage popup messages that appear to all
          users when they access the dashboard.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            How to Manage Popup Messages
          </CardTitle>
          <CardDescription>Step-by-step guide for admin notification settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#3457D5] text-white font-semibold">
                  1
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Navigate to Admin Settings</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Go to <code className="bg-gray-100 px-2 py-1 rounded text-xs">/admin/settings</code> in your admin
                  dashboard
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#3457D5] text-white font-semibold">
                  2
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Click on Notifications Tab</h4>
                <p className="text-sm text-gray-600 mt-1">
                  In the settings page, find and click the <strong>"Notifications"</strong> tab
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#3457D5] text-white font-semibold">
                  3
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Create New Popup Message</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Click the <strong>"Create New Message"</strong> button to add a new popup message
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#3457D5] text-white font-semibold">
                  4
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Configure Message Details</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Fill in the message title, content, and select the message type (Info, Warning, Success, Error)
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#3457D5] text-white font-semibold">
                  5
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Personalize with User Name</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Use{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {"{"}
                    {"{"}userName{"}"}
                    {"}"}
                  </code>{" "}
                  in your message to include the user's name. Example: "Welcome back, {"{"}userName{"}"}!"
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#3457D5] text-white font-semibold">
                  6
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Preview & Activate</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Preview how the message will appear to users, then toggle the <strong>"Active"</strong> switch to
                  enable it
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">Message Types</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Info - General information</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Warning - Important alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Success - Positive updates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Error - Critical issues</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#CCCCFF]/10 border-[#3457D5]/20">
        <CardHeader>
          <CardTitle className="text-[#3457D5]">Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/admin/settings/notifications">
            <Button className="w-full bg-[#3457D5] hover:bg-[#3457D5]/90">
              Go to Notification Settings
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
