'use client';

import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Settings, Bell, Shield } from 'lucide-react';
import { Navigation } from '@/components/Navigation';

export default function ProfilePage() {
  return (
    <>
    <div className="min-h-screen bg-gray-50 p-6 pb-24 lg:pb-8 lg:pl-72">
      <div className="lg:px-8 lg:py-8 max-w-6xl space-y-6">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-8 bg-white rounded-3xl p-8 border border-gray-200">
          <div>
            <h1 className="text-4xl font-black text-gray-900">Profile & Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account and preferences</p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile & Settings</h1>
          <UserButton afterSignOutUrl="/" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Photos</CardTitle>
            <CardDescription>Manage your photos for virtual try-on</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-primary transition cursor-pointer"
                >
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              ))}
            </div>
            <Button className="mt-4">
              <Camera className="mr-2 h-4 w-4" />
              Upload New Photo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Style Preferences</CardTitle>
            <CardDescription>Update your sizing and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="topSize">Top Size</Label>
                <Input id="topSize" placeholder="S, M, L, XL" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="bottomSize">Bottom Size</Label>
                <Input id="bottomSize" placeholder="28, 30, 32" className="mt-2" />
              </div>
            </div>
            <div>
              <Label>Budget Range</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input placeholder="Min ($)" type="number" />
                <Input placeholder="Max ($)" type="number" />
              </div>
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Bell className="inline mr-2 h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email notifications</p>
                <p className="text-sm text-gray-600">Receive emails about new trends</p>
              </div>
              <Button variant="outline" size="sm">Toggle</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push notifications</p>
                <p className="text-sm text-gray-600">Get notified about new recommendations</p>
              </div>
              <Button variant="outline" size="sm">Toggle</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Shield className="inline mr-2 h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">Change Password</Button>
            <Button variant="outline" className="w-full">Download My Data</Button>
            <Button variant="destructive" className="w-full">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
    <Navigation />
    </>
  );
}
