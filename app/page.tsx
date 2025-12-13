import { Package, Users, TrendingUp, AlertCircle, Activity, ArrowRight } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary text-primary-foreground shadow-xl ring-2 ring-primary/20">
                <Package className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-balance bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  ReliefTrack
                </h1>
                <p className="text-sm font-medium text-muted-foreground">Disaster Relief Distribution System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <Badge className="bg-red-600 text-white hover:bg-red-700 shadow-md px-3 py-1">SDG 1: No Poverty</Badge>
                <Badge className="bg-yellow-600 text-white hover:bg-yellow-700 shadow-md px-3 py-1">
                  SDG 2: Zero Hunger
                </Badge>
              </div>
              <Badge
                variant="outline"
                className="gap-1.5 border-green-600/30 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 shadow-sm px-3 py-1"
              >
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
                System Online
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <Link href="/">
              <Button variant="ghost" className="rounded-none border-b-2 border-primary font-semibold">
                Dashboard
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary/50">
                Inventory
              </Button>
            </Link>
            <Link href="/households">
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary/50">
                Households
              </Button>
            </Link>
            <Link href="/distributions">
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary/50">
                Distributions
              </Button>
            </Link>
            <Link href="/activity">
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-primary/50">
                Activity Log
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Statistics Cards - Made cards clickable with hover effects and navigation arrows */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/households" className="group">
            <Card className="border-l-4 border-l-primary shadow-lg transition-all hover:shadow-2xl hover:scale-105 hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-primary">Registered Households</CardTitle>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{totalHouseholds || 0}</div>
                <p className="text-xs text-muted-foreground font-medium mt-1">Active beneficiaries in system</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/inventory" className="group">
            <Card className="border-l-4 border-l-secondary shadow-lg transition-all hover:shadow-2xl hover:scale-105 hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-card to-secondary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-secondary">Inventory Items</CardTitle>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-secondary" />
                  <ArrowRight className="h-4 w-4 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{totalInventory || 0}</div>
                <p className="text-xs text-muted-foreground font-medium mt-1">Available supply types</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/distributions" className="group">
            <Card className="border-l-4 border-l-accent shadow-lg transition-all hover:shadow-2xl hover:scale-105 hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-card to-accent/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-accent">Total Distributions</CardTitle>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <ArrowRight className="h-4 w-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">{totalDistributions || 0}</div>
                <p className="text-xs text-muted-foreground font-medium mt-1">Relief goods distributed</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/activity" className="group">
            <Card className="border-l-4 border-l-chart-4 shadow-lg transition-all hover:shadow-2xl hover:scale-105 hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-card to-purple-500/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  System Activities
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <ArrowRight className="h-4 w-4 text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalActivities || 0}</div>
                <p className="text-xs text-muted-foreground font-medium mt-1">Total logged actions</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems && lowStockItems.length > 0 && (
          <Card className="mb-8 border-2 border-orange-400 bg-gradient-to-br from-orange-50 via-red-50 to-orange-50 shadow-xl dark:border-orange-700/50 dark:from-orange-950/30 dark:to-red-950/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                  <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-orange-900 dark:text-orange-100">Low Stock Alert</CardTitle>
                  <CardDescription className="text-orange-800/70 dark:text-orange-200/70">
                    {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""} need restocking
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border-2 border-orange-200 bg-card p-4 shadow-md dark:border-orange-800"
                  >
                    <div>
                      <p className="font-semibold text-lg">{item.item_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Category: {item.category.replace("_", " ").toUpperCase()}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-sm px-3 py-1 shadow-sm">
                      {item.quantity} {item.unit} remaining
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions - Enhanced visual design with better spacing and gradients */}
        <Card className="shadow-xl border-2">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-base">Common tasks for relief distribution management</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/inventory?action=add">
                <Button
                  className="w-full shadow-md transition-all hover:shadow-lg h-12 text-base bg-primary/5 hover:bg-primary/10 border-2 border-primary/20"
                  variant="outline"
                >
                  <Package className="mr-2 h-5 w-5" />
                  Add Inventory
                </Button>
              </Link>
              <Link href="/households?action=register">
                <Button
                  className="w-full shadow-md transition-all hover:shadow-lg h-12 text-base bg-secondary/5 hover:bg-secondary/10 border-2 border-secondary/20"
                  variant="outline"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Register Household
                </Button>
              </Link>
              <Link href="/distributions?action=new">
                <Button
                  className="w-full shadow-md transition-all hover:shadow-lg h-12 text-base bg-accent/5 hover:bg-accent/10 border-2 border-accent/20"
                  variant="outline"
                >
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Record Distribution
                </Button>
              </Link>
              <Link href="/inventory">
                <Button
                  className="w-full shadow-md transition-all hover:shadow-lg h-12 text-base bg-orange-500/5 hover:bg-orange-500/10 border-2 border-orange-500/20"
                  variant="outline"
                >
                  <AlertCircle className="mr-2 h-5 w-5" />
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
