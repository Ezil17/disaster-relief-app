"use client"

import { useState, useEffect } from "react"
import { Package, Plus, Pencil, Trash2, Search } from "lucide-react"
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>Add, update, and monitor relief supply inventories in real time</CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell>
                          {item.quantity < item.low_stock_threshold ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
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
