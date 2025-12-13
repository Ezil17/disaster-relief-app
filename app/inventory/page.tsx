"use client"

import { useState, useEffect } from "react"
import { Package, Plus, Pencil, Trash2, Search, AlertTriangle, Box, TrendingDown } from "lucide-react"
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
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { logActivity } from "@/lib/activity-logger"

type InventoryItem = {
  id: string
  item_name: string
  category: string
  quantity: number
  unit: string
  low_stock_threshold: number
  created_at: string
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    item_name: "",
    category: "food_pack",
    quantity: 0,
    unit: "pcs",
    low_stock_threshold: 10,
  })

  useEffect(() => {
    fetchInventory()
    // Check if action=add is in URL
    if (searchParams.get("action") === "add") {
      setIsAddDialogOpen(true)
    }
  }, [])

  useEffect(() => {
    filterItems()
  }, [items, searchQuery, categoryFilter])

  const fetchInventory = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from("inventory").select("*").order("created_at", { ascending: false })

    if (!error && data) {
      setItems(data)
    }
    setIsLoading(false)
  }

  const filterItems = () => {
    let filtered = items

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter((item) => item.item_name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    setFilteredItems(filtered)
  }

  const handleAdd = async () => {
    const { data, error } = await supabase.from("inventory").insert([formData]).select().single()

    if (!error && data) {
      await logActivity({
        action_type: "create",
        entity_type: "inventory",
        entity_id: data.id,
        entity_name: formData.item_name,
        performed_by: "Admin User",
        details: { category: formData.category, quantity: formData.quantity },
      })

      setIsAddDialogOpen(false)
      setFormData({
        item_name: "",
        category: "food_pack",
        quantity: 0,
        unit: "pcs",
        low_stock_threshold: 10,
      })
      fetchInventory()
    }
  }

  const handleEdit = async () => {
    if (!selectedItem) return

    const { error } = await supabase.from("inventory").update(formData).eq("id", selectedItem.id)

    if (!error) {
      await logActivity({
        action_type: "update",
        entity_type: "inventory",
        entity_id: selectedItem.id,
        entity_name: formData.item_name,
        performed_by: "Admin User",
        details: { previous_quantity: selectedItem.quantity, new_quantity: formData.quantity },
      })

      setIsEditDialogOpen(false)
      setSelectedItem(null)
      fetchInventory()
    }
  }

  const handleDelete = async (id: string) => {
    const itemToDelete = items.find((item) => item.id === id)
    if (!itemToDelete) return

    if (confirm("Are you sure you want to delete this item?")) {
      const { error } = await supabase.from("inventory").delete().eq("id", id)

      if (!error) {
        await logActivity({
          action_type: "delete",
          entity_type: "inventory",
          entity_id: id,
          entity_name: itemToDelete.item_name,
          performed_by: "Admin User",
          details: { category: itemToDelete.category },
        })

        fetchInventory()
      }
    }
  }

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setFormData({
      item_name: item.item_name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      low_stock_threshold: item.low_stock_threshold,
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-gradient-to-r from-card via-primary/5 to-card backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20 ring-2 ring-primary/20">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">ReliefTrack</h1>
                <p className="text-xs text-muted-foreground">Inventory Management</p>
              </div>
            </div>
            <Badge className="gap-2 bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              <Box className="h-3 w-3" />
              Stock Control
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
              <Button variant="ghost" className="rounded-none border-b-2 border-primary">
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats Banner */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/10 to-transparent">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{items.length}</div>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {items.filter((item) => item.quantity < item.low_stock_threshold).length}
                </div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-secondary bg-gradient-to-r from-secondary/10 to-transparent">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
                <TrendingDown className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                <p className="text-sm text-muted-foreground">Total Quantity</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-2 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Inventory Management</CardTitle>
                <CardDescription className="text-base">
                  Add, update, and monitor relief supply inventories in real time
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-2 focus:border-primary"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full border-2 sm:w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="food_pack">Food Pack</SelectItem>
                  <SelectItem value="hygiene_kit">Hygiene Kit</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Inventory Table */}
            <div className="rounded-lg border-2 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Item Name</TableHead>
                    <TableHead className="font-bold">Category</TableHead>
                    <TableHead className="font-bold">Quantity</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Loading...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-primary/5">
                        <TableCell className="font-semibold">{item.item_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {item.category.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell>
                          {item.quantity < item.low_stock_threshold ? (
                            <Badge variant="destructive" className="gap-1 shadow-sm">
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 shadow-sm"
                            >
                              <Box className="h-3 w-3" />
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                              className="hover:bg-primary/10 hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>Add a new relief supply item to the inventory</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="item_name">Item Name</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                placeholder="e.g., Rice Pack (5kg)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food_pack">Food Pack</SelectItem>
                  <SelectItem value="hygiene_kit">Hygiene Kit</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., pcs, boxes"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="threshold">Low Stock Threshold</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                value={formData.low_stock_threshold}
                onChange={(e) =>
                  setFormData({ ...formData, low_stock_threshold: Number.parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update the relief supply item details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_item_name">Item Name</Label>
              <Input
                id="edit_item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food_pack">Food Pack</SelectItem>
                  <SelectItem value="hygiene_kit">Hygiene Kit</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_quantity">Quantity</Label>
                <Input
                  id="edit_quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_unit">Unit</Label>
                <Input
                  id="edit_unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_threshold">Low Stock Threshold</Label>
              <Input
                id="edit_threshold"
                type="number"
                min="0"
                value={formData.low_stock_threshold}
                onChange={(e) =>
                  setFormData({ ...formData, low_stock_threshold: Number.parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
