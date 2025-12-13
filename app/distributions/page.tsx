"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Plus, Search, Calendar, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useSearchParams } from "next/navigation"
import { logActivity } from "@/lib/activity-logger"

type Distribution = {
  id: string
  household_id: string
  inventory_id: string
  quantity_distributed: number
  distributed_by: string
  distributed_at: string
  notes: string | null
  household?: {
    household_number: string
    head_of_family: string
    purok: string
  }
  inventory?: {
    item_name: string
    unit: string
    category: string
  }
}

type Household = {
  id: string
  household_number: string
  head_of_family: string
  purok: string
}

type InventoryItem = {
  id: string
  item_name: string
  quantity: number
  unit: string
}

export default function DistributionsPage() {
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [filteredDistributions, setFilteredDistributions] = useState<Distribution[]>([])
  const [households, setHouseholds] = useState<Household[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [purokFilter, setPurokFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    household_id: "",
    inventory_id: "",
    quantity_distributed: 1,
    distributed_by: "",
    notes: "",
  })

  useEffect(() => {
    fetchData()
    if (searchParams.get("action") === "new") {
      setIsAddDialogOpen(true)
    }
  }, [])

  useEffect(() => {
    filterDistributions()
  }, [distributions, searchQuery, purokFilter])

  const fetchData = async () => {
    setIsLoading(true)

    const [distributionsRes, householdsRes, inventoryRes] = await Promise.all([
      supabase
        .from("distributions")
        .select(`
          *,
          household:households(household_number, head_of_family, purok),
          inventory:inventory(item_name, unit, category)
        `)
        .order("distributed_at", { ascending: false }),
      supabase.from("households").select("*").order("household_number"),
      supabase.from("inventory").select("*").gt("quantity", 0).order("item_name"),
    ])

    if (!distributionsRes.error && distributionsRes.data) {
      setDistributions(distributionsRes.data)
    }
    if (!householdsRes.error && householdsRes.data) {
      setHouseholds(householdsRes.data)
    }
    if (!inventoryRes.error && inventoryRes.data) {
      setInventory(inventoryRes.data)
    }

    setIsLoading(false)
  }

  const filterDistributions = () => {
    let filtered = distributions

    if (purokFilter !== "all") {
      filtered = filtered.filter((d) => d.household?.purok === purokFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (d) =>
          d.household?.household_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.household?.head_of_family.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.inventory?.item_name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredDistributions(filtered)
  }

  const handleAdd = async () => {
    setError(null)

    if (!formData.household_id || !formData.inventory_id || !formData.distributed_by) {
      setError("Please fill in all required fields")
      return
    }

    // Check if selected inventory item has enough quantity
    const selectedItem = inventory.find((item) => item.id === formData.inventory_id)
    const selectedHousehold = households.find((h) => h.id === formData.household_id)

    if (!selectedItem || selectedItem.quantity < formData.quantity_distributed) {
      setError("Insufficient inventory quantity")
      return
    }

    // Insert distribution record
    const { data: distributionData, error: insertError } = await supabase
      .from("distributions")
      .insert([formData])
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return
    }

    // Update inventory quantity
    const { error: updateError } = await supabase
      .from("inventory")
      .update({
        quantity: selectedItem.quantity - formData.quantity_distributed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", formData.inventory_id)

    if (!updateError && distributionData) {
      await logActivity({
        action_type: "create",
        entity_type: "distribution",
        entity_id: distributionData.id,
        entity_name: `${selectedItem.item_name} to ${selectedHousehold?.household_number}`,
        performed_by: formData.distributed_by,
        details: {
          quantity: formData.quantity_distributed,
          item: selectedItem.item_name,
          household: selectedHousehold?.household_number,
          purok: selectedHousehold?.purok,
        },
      })

      setIsAddDialogOpen(false)
      setFormData({
        household_id: "",
        inventory_id: "",
        quantity_distributed: 1,
        distributed_by: "",
        notes: "",
      })
      setError(null)
      fetchData()
    } else {
      setError(updateError?.message || "An error occurred")
    }
  }

  const puroks = Array.from(new Set(households.map((h) => h.purok))).sort()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <header className="border-b bg-gradient-to-r from-card via-accent/10 to-card backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/70 shadow-lg shadow-accent/20 ring-2 ring-accent/20">
                <TrendingUp className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">ReliefTrack</h1>
                <p className="text-xs text-muted-foreground">Distribution Tracking</p>
              </div>
            </div>
            <Badge className="gap-2 bg-accent/20 text-accent-foreground border-accent">
              <TrendingUp className="h-3 w-3" />
              Live Distribution
            </Badge>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <Link href="/">
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent">
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
              <Button variant="ghost" className="rounded-none border-b-2 border-primary">
                Distributions
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Card className="overflow-hidden border-2 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-accent/10 via-transparent to-accent/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Distribution Tracking</CardTitle>
                <CardDescription className="text-base">
                  Record and monitor relief goods distribution to households
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-2 bg-gradient-to-r from-accent to-accent/80 shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                Record Distribution
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by household or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-2 focus:border-accent"
                />
              </div>
              <Select value={purokFilter} onValueChange={setPurokFilter}>
                <SelectTrigger className="w-full border-2 sm:w-[200px]">
                  <SelectValue placeholder="Filter by purok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Puroks</SelectItem>
                  {puroks.map((purok) => (
                    <SelectItem key={purok} value={purok}>
                      {purok}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Distribution Table */}
            <div className="rounded-lg border-2 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-accent/10">
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Household</TableHead>
                    <TableHead className="font-bold">Purok</TableHead>
                    <TableHead className="font-bold">Item Distributed</TableHead>
                    <TableHead className="font-bold">Quantity</TableHead>
                    <TableHead className="font-bold">Distributed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                          Loading...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredDistributions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        No distributions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDistributions.map((distribution) => (
                      <TableRow key={distribution.id} className="hover:bg-accent/5">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20">
                              <Calendar className="h-4 w-4 text-accent-foreground" />
                            </div>
                            <span className="text-sm">
                              {new Date(distribution.distributed_at).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold">{distribution.household?.head_of_family}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {distribution.household?.household_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium border-2">
                            {distribution.household?.purok}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold">{distribution.inventory?.item_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {distribution.inventory?.category.replace("_", " ")}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/30 font-bold">
                            {distribution.quantity_distributed} {distribution.inventory?.unit}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{distribution.distributed_by}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Distribution</DialogTitle>
            <DialogDescription>Record relief goods distribution to a household</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="household">Household *</Label>
              <Select
                value={formData.household_id}
                onValueChange={(value) => setFormData({ ...formData, household_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select household" />
                </SelectTrigger>
                <SelectContent>
                  {households.map((household) => (
                    <SelectItem key={household.id} value={household.id}>
                      {household.household_number} - {household.head_of_family} ({household.purok})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item">Relief Item *</Label>
              <Select
                value={formData.inventory_id}
                onValueChange={(value) => setFormData({ ...formData, inventory_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.item_name} (Available: {item.quantity} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity to Distribute *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity_distributed}
                onChange={(e) =>
                  setFormData({ ...formData, quantity_distributed: Number.parseInt(e.target.value) || 1 })
                }
              />
              {formData.inventory_id && (
                <p className="text-xs text-muted-foreground">
                  Available: {inventory.find((i) => i.id === formData.inventory_id)?.quantity || 0}{" "}
                  {inventory.find((i) => i.id === formData.inventory_id)?.unit || ""}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="distributed_by">Distributed By *</Label>
              <Input
                id="distributed_by"
                value={formData.distributed_by}
                onChange={(e) => setFormData({ ...formData, distributed_by: e.target.value })}
                placeholder="e.g., Relief Officer Name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the distribution"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                setError(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd}>Record Distribution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
