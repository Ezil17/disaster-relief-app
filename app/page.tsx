import { Package, Users, TrendingUp, AlertCircle, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { count: totalHouseholds },
    { count: totalInventory },
    { count: totalDistributions },
    { data: allInventory },
    { count: totalActivities },
  ] = await Promise.all([
    supabase.from("households").select("*", { count: "exact", head: true }),
    supabase.from("inventory").select("*", { count: "exact", head: true }),
    supabase.from("distributions").select("*", { count: "exact", head: true }),
    supabase.from("inventory").select("*").order("quantity", { ascending: true }),
    supabase.from("activity_logs").select("*", { count: "exact", head: true }),
  ])

  const lowStockItems = allInventory?.filter((item) => item.quantity < item.low_stock_threshold) || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">ReliefTrack</h1>
                <p className="text-xs text-muted-foreground">Disaster Relief Distribution System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                System Online
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <Link href="/">
              <Button variant="ghost" className="rounded-none border-b-2 border-primary">
                Dashboard
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent">
                Inventory
              </Button>
            </Link>
            <Link href="/households">
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent">
                Households
              </Button>
            </Link>
            <Link href="/distributions">
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent">
                Distributions
              </Button>
            </Link>
            <Link href="/activity">
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent">
                Activity Log
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* SDG Banner */}
        <div className="mb-8 rounded-lg border bg-gradient-to-r from-blue-50 to-green-50 p-6 dark:from-blue-950/20 dark:to-green-950/20">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h2 className="mb-2 text-lg font-semibold">Supporting UN Sustainable Development Goals</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                ReliefTrack supports SDG 1 (No Poverty) and SDG 2 (Zero Hunger) through fair and transparent disaster
                relief distribution.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                  SDG 1: No Poverty
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                >
                  SDG 2: Zero Hunger
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Registered Households</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHouseholds || 0}</div>
              <p className="text-xs text-muted-foreground">Active beneficiaries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInventory || 0}</div>
              <p className="text-xs text-muted-foreground">Available supply types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Distributions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDistributions || 0}</div>
              <p className="text-xs text-muted-foreground">Relief goods distributed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">System Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalActivities || 0}</div>
              <p className="text-xs text-muted-foreground">Total logged actions</p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems && lowStockItems.length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <CardTitle className="text-orange-900 dark:text-orange-100">Low Stock Alert</CardTitle>
              </div>
              <CardDescription>The following items need restocking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <div>
                      <p className="font-medium">{item.item_name}</p>
                      <p className="text-sm text-muted-foreground">Category: {item.category.replace("_", " ")}</p>
                    </div>
                    <Badge variant="destructive">
                      {item.quantity} {item.unit} remaining
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for relief distribution management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/inventory?action=add">
                <Button className="w-full bg-transparent" variant="outline">
                  <Package className="mr-2 h-4 w-4" />
                  Add Inventory
                </Button>
              </Link>
              <Link href="/households?action=register">
                <Button className="w-full bg-transparent" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Register Household
                </Button>
              </Link>
              <Link href="/distributions?action=new">
                <Button className="w-full bg-transparent" variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Record Distribution
                </Button>
              </Link>
              <Link href="/inventory">
                <Button className="w-full bg-transparent" variant="outline">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  View Stock Levels
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
