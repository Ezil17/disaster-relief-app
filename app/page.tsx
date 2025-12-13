"use client"

import { Package, Users, TrendingUp, AlertCircle, Activity, Shield, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function HomePage() {
  const [totalHouseholds, setTotalHouseholds] = useState(0)
  const [totalInventory, setTotalInventory] = useState(0)
  const [totalDistributions, setTotalDistributions] = useState(0)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [totalActivities, setTotalActivities] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const [
        { count: households },
        { count: inventory },
        { count: distributions },
        { data: allInventory },
        { count: activities },
      ] = await Promise.all([
        supabase.from("households").select("*", { count: "exact", head: true }),
        supabase.from("inventory").select("*", { count: "exact", head: true }),
        supabase.from("distributions").select("*", { count: "exact", head: true }),
        supabase.from("inventory").select("*").order("quantity", { ascending: true }),
        supabase.from("activity_logs").select("*", { count: "exact", head: true }),
      ])

      setTotalHouseholds(households || 0)
      setTotalInventory(inventory || 0)
      setTotalDistributions(distributions || 0)
      setTotalActivities(activities || 0)
      setLowStockItems(allInventory?.filter((item) => item.quantity < item.low_stock_threshold) || [])
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Header */}
      <header className="border-b-4 border-primary/20 bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-4 ring-white/30">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">ReliefTrack</h1>
                <p className="text-sm opacity-95 font-medium">Disaster Relief Distribution System</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/20 text-white backdrop-blur-sm ring-2 ring-white/30 px-3 py-1">
                <Shield className="mr-1.5 h-3.5 w-3.5" />
                System Online
              </Badge>
              <Dialog>
                <DialogTrigger asChild>
                  <Badge className="bg-red-600 text-white px-3 py-1 cursor-pointer hover:bg-red-700 transition-colors">
                    SDG 1: No Poverty
                  </Badge>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                      <Info className="h-5 w-5" />
                      SDG 1: No Poverty
                    </DialogTitle>
                    <DialogDescription className="space-y-3 pt-2">
                      <div className="text-base">
                        <strong>Goal:</strong> End poverty in all its forms everywhere.
                      </div>
                      <div>
                        ReliefTrack contributes to SDG 1 by ensuring that vulnerable families receive essential relief
                        supplies during disasters, helping prevent them from falling deeper into poverty. By tracking
                        and distributing resources fairly, the system protects communities from the economic shocks of
                        disasters.
                      </div>
                      <div>
                        The platform prevents duplicate distribution, ensures no household is missed, and maintains
                        transparent records of all relief activities - key elements in poverty reduction during
                        emergencies.
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Badge className="bg-yellow-600 text-white px-3 py-1 cursor-pointer hover:bg-yellow-700 transition-colors">
                    SDG 2: Zero Hunger
                  </Badge>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-yellow-600">
                      <Info className="h-5 w-5" />
                      SDG 2: Zero Hunger
                    </DialogTitle>
                    <DialogDescription className="space-y-3 pt-2">
                      <div className="text-base">
                        <strong>Goal:</strong> End hunger, achieve food security and improved nutrition.
                      </div>
                      <div>
                        ReliefTrack directly supports SDG 2 by managing and distributing food packs and essential
                        supplies to disaster-affected communities. The system tracks inventory levels, sends low-stock
                        alerts, and ensures food reaches those who need it most.
                      </div>
                      <div>
                        Through categorized inventory management (food packs, water, medical supplies), the platform
                        helps maintain food security during emergencies and ensures no household goes hungry after a
                        disaster.
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3">
            <Link href="/">
              <Button variant="default" size="sm" className="rounded-full bg-primary hover:bg-primary/90">
                Dashboard
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10">
                Inventory
              </Button>
            </Link>
            <Link href="/households">
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-secondary/10">
                Households
              </Button>
            </Link>
            <Link href="/distributions">
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-accent/20">
                Distributions
              </Button>
            </Link>
            <Link href="/activity">
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10">
                Activity Log
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/households">
            <Card className="group cursor-pointer overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:border-secondary bg-gradient-to-br from-secondary/10 to-white dark:to-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Registered Households</CardTitle>
                <div className="rounded-xl bg-secondary/20 p-3 group-hover:bg-secondary/30 transition-colors">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-secondary">{totalHouseholds || 0}</div>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Active beneficiaries</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/inventory">
            <Card className="group cursor-pointer overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:border-primary bg-gradient-to-br from-primary/10 to-white dark:to-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Inventory Items</CardTitle>
                <div className="rounded-xl bg-primary/20 p-3 group-hover:bg-primary/30 transition-colors">
                  <Package className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">{totalInventory || 0}</div>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Supply types</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/distributions">
            <Card className="group cursor-pointer overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:border-accent bg-gradient-to-br from-accent/10 to-white dark:to-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Distributions</CardTitle>
                <div className="rounded-xl bg-accent/30 p-3 group-hover:bg-accent/40 transition-colors">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-accent-foreground">{totalDistributions || 0}</div>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Relief goods delivered</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/activity">
            <Card className="group cursor-pointer overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:border-primary bg-gradient-to-br from-primary/5 to-white dark:to-card shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">System Activities</CardTitle>
                <div className="rounded-xl bg-primary/15 p-3 group-hover:bg-primary/25 transition-colors">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">{totalActivities || 0}</div>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Logged actions</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems && lowStockItems.length > 0 && (
          <Card className="mb-8 border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/20 dark:to-card shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-100 p-3 dark:bg-orange-900/30">
                  <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-orange-700 dark:text-orange-400">Low Stock Alert</CardTitle>
                  <CardDescription className="text-orange-600/80 dark:text-orange-400/70">
                    {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""} need restocking
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border-2 border-orange-200 bg-white p-4 shadow-sm dark:border-orange-900/50 dark:bg-card"
                  >
                    <div>
                      <p className="font-bold text-foreground">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground font-medium">{item.category.replace("_", " ")}</p>
                    </div>
                    <Badge variant="destructive" className="rounded-full px-3 py-1 text-sm font-bold">
                      {item.quantity} {item.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="overflow-hidden border-2 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-muted/30 to-transparent">
            <CardTitle className="text-2xl">Quick Actions</CardTitle>
            <CardDescription className="text-base">Common tasks for relief distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/inventory">
                <Button className="h-auto w-full flex-col gap-3 rounded-2xl py-6 bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105">
                  <Package className="h-8 w-8" />
                  <span className="font-semibold">Add Inventory</span>
                </Button>
              </Link>

              <Link href="/households">
                <Button className="h-auto w-full flex-col gap-3 rounded-2xl py-6 bg-gradient-to-br from-secondary to-secondary/80 shadow-lg shadow-secondary/30 hover:shadow-xl hover:shadow-secondary/40 transition-all duration-300 hover:scale-105">
                  <Users className="h-8 w-8" />
                  <span className="font-semibold">Register Household</span>
                </Button>
              </Link>

              <Link href="/distributions">
                <Button className="h-auto w-full flex-col gap-3 rounded-2xl py-6 bg-gradient-to-br from-accent/80 to-accent/60 text-accent-foreground shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 transition-all duration-300 hover:scale-105">
                  <TrendingUp className="h-8 w-8" />
                  <span className="font-semibold">Record Distribution</span>
                </Button>
              </Link>

              <Link href="/inventory">
                <Button className="h-auto w-full flex-col gap-3 rounded-2xl py-6 bg-gradient-to-br from-primary/70 to-primary/50 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105">
                  <AlertCircle className="h-8 w-8" />
                  <span className="font-semibold">View Stock Levels</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
