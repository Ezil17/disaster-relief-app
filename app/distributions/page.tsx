"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Plus, Search, Calendar } from "lucide-react"
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">ReliefTrack</h1>
                <p className="text-xs text-muted-foreground">Disaster Relief Distribution System</p>
              </div>
            </div>
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Distribution Tracking</CardTitle>
                <CardDescription>Record and monitor relief goods distribution to households</CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Record Distribution
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by household or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={purokFilter} onValueChange={setPurokFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Household</TableHead>
                    <TableHead>Purok</TableHead>
                    <TableHead>Item Distributed</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Distributed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredDistributions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No distributions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDistributions.map((distribution) => (
                      <TableRow key={distribution.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(distribution.distributed_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{distribution.household?.head_of_family}</div>
                            <div className="text-sm text-muted-foreground">
                              {distribution.household?.household_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{distribution.household?.purok}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{distribution.inventory?.item_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {distribution.inventory?.category.replace("_", " ")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {distribution.quantity_distributed} {distribution.inventory?.unit}
                        </TableCell>
                        <TableCell className="text-sm">{distribution.distributed_by}</TableCell>
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
