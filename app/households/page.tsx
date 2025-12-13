"use client"

import { useState, useEffect } from "react"
import { Users, Plus, Pencil, Trash2, Search, MapPin, UserCheck, Home } from "lucide-react"
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
import { useSearchParams } from "next/navigation"
import { logActivity } from "@/lib/activity-logger"

type Household = {
  id: string
  household_number: string
  head_of_family: string
  purok: string
  address: string
  contact_number: string | null
  family_members: number
  registered_at: string
}

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [filteredHouseholds, setFilteredHouseholds] = useState<Household[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [purokFilter, setPurokFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    household_number: "",
    head_of_family: "",
    purok: "Purok 1",
    address: "",
    contact_number: "",
    family_members: 1,
  })

  useEffect(() => {
    fetchHouseholds()
    if (searchParams.get("action") === "register") {
      setIsAddDialogOpen(true)
    }
  }, [])

  useEffect(() => {
    filterHouseholds()
  }, [households, searchQuery, purokFilter])

  const fetchHouseholds = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from("households").select("*").order("registered_at", { ascending: false })

    if (!error && data) {
      setHouseholds(data)
    }
    setIsLoading(false)
  }

  const filterHouseholds = () => {
    let filtered = households

    if (purokFilter !== "all") {
      filtered = filtered.filter((h) => h.purok === purokFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (h) =>
          h.household_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.head_of_family.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredHouseholds(filtered)
  }

  const handleAdd = async () => {
    setError(null)

    // Check for duplicate household number
    const { data: existing } = await supabase
      .from("households")
      .select("id")
      .eq("household_number", formData.household_number)
      .single()

    if (existing) {
      setError("Household number already exists. Please use a unique household number.")
      return
    }

    const { data, error: insertError } = await supabase.from("households").insert([formData]).select().single()

    if (!insertError && data) {
      await logActivity({
        action_type: "create",
        entity_type: "household",
        entity_id: data.id,
        entity_name: `${formData.household_number} - ${formData.head_of_family}`,
        performed_by: "Admin User",
        details: { purok: formData.purok, family_members: formData.family_members },
      })

      setIsAddDialogOpen(false)
      setFormData({
        household_number: "",
        head_of_family: "",
        purok: "Purok 1",
        address: "",
        contact_number: "",
        family_members: 1,
      })
      setError(null)
      fetchHouseholds()
    } else {
      setError(insertError?.message || "An error occurred")
    }
  }

  const handleEdit = async () => {
    if (!selectedHousehold) return
    setError(null)

    // Check for duplicate household number (excluding current)
    const { data: existing } = await supabase
      .from("households")
      .select("id")
      .eq("household_number", formData.household_number)
      .neq("id", selectedHousehold.id)
      .single()

    if (existing) {
      setError("Household number already exists. Please use a unique household number.")
      return
    }

    const { error: updateError } = await supabase.from("households").update(formData).eq("id", selectedHousehold.id)

    if (!updateError) {
      await logActivity({
        action_type: "update",
        entity_type: "household",
        entity_id: selectedHousehold.id,
        entity_name: `${formData.household_number} - ${formData.head_of_family}`,
        performed_by: "Admin User",
        details: { purok: formData.purok },
      })

      setIsEditDialogOpen(false)
      setSelectedHousehold(null)
      setError(null)
      fetchHouseholds()
    } else {
      setError(updateError.message)
    }
  }

  const handleDelete = async (id: string) => {
    const householdToDelete = households.find((h) => h.id === id)
    if (!householdToDelete) return

    if (confirm("Are you sure you want to delete this household? This will also delete all distribution records.")) {
      const { error } = await supabase.from("households").delete().eq("id", id)

      if (!error) {
        await logActivity({
          action_type: "delete",
          entity_type: "household",
          entity_id: id,
          entity_name: `${householdToDelete.household_number} - ${householdToDelete.head_of_family}`,
          performed_by: "Admin User",
          details: { purok: householdToDelete.purok },
        })

        fetchHouseholds()
      }
    }
  }

  const openEditDialog = (household: Household) => {
    setSelectedHousehold(household)
    setFormData({
      household_number: household.household_number,
      head_of_family: household.head_of_family,
      purok: household.purok,
      address: household.address,
      contact_number: household.contact_number || "",
      family_members: household.family_members,
    })
    setError(null)
    setIsEditDialogOpen(true)
  }

  // Get unique puroks from households
  const puroks = Array.from(new Set(households.map((h) => h.purok))).sort()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background">
      <header className="border-b bg-gradient-to-r from-card via-secondary/10 to-card backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground shadow-lg shadow-secondary/20 ring-2 ring-secondary/20">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">ReliefTrack</h1>
                <p className="text-xs text-muted-foreground">Household Registry</p>
              </div>
            </div>
            <Badge className="gap-2 bg-secondary/20 text-secondary-foreground border-secondary">
              <UserCheck className="h-3 w-3" />
              Registration System
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
              <Button variant="ghost" className="rounded-none border-b-2 border-primary">
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

      <main className="container mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="overflow-hidden border-2 border-secondary/20 bg-gradient-to-br from-secondary/10 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-secondary">{filteredHouseholds.length}</div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {purokFilter === "all" ? "Total Households" : `Households in ${purokFilter}`}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/20">
                  <Home className="h-7 w-7 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {filteredHouseholds.reduce((sum, h) => sum + h.family_members, 0)}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Total Family Members</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
                  <Users className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-2 border-accent/20 bg-gradient-to-br from-accent/10 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-accent-foreground">{puroks.length}</div>
                  <p className="text-sm font-medium text-muted-foreground">Active Puroks</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
                  <MapPin className="h-7 w-7 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-2 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-secondary/10 via-transparent to-secondary/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Household Registration & Validation</CardTitle>
                <CardDescription className="text-base">
                  Register households with unique identifiers and prevent duplicate distribution
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-2 bg-gradient-to-r from-secondary to-secondary/80 shadow-lg shadow-secondary/30 hover:shadow-xl hover:shadow-secondary/40"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                Register Household
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by household number or head of family..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-2 focus:border-secondary"
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

            {/* Household Table */}
            <div className="rounded-lg border-2 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/10">
                    <TableHead className="font-bold">Household Number</TableHead>
                    <TableHead className="font-bold">Head of Family</TableHead>
                    <TableHead className="font-bold">Purok</TableHead>
                    <TableHead className="font-bold">Family Members</TableHead>
                    <TableHead className="font-bold">Contact</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
                          Loading...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredHouseholds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        No households found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHouseholds.map((household) => (
                      <TableRow key={household.id} className="hover:bg-secondary/5">
                        <TableCell className="font-semibold">
                          <Badge variant="outline" className="font-mono font-bold border-2">
                            {household.household_number}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{household.head_of_family}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20">
                              <MapPin className="h-4 w-4 text-secondary" />
                            </div>
                            <span className="font-medium">{household.purok}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-primary/20 text-primary-foreground border-primary/30">
                            {household.family_members} members
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {household.contact_number || "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(household)}
                              className="hover:bg-secondary/20 hover:text-secondary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(household.id)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Household</DialogTitle>
            <DialogDescription>Register a new household with a unique household number</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="household_number">Household Number *</Label>
              <Input
                id="household_number"
                value={formData.household_number}
                onChange={(e) => setFormData({ ...formData, household_number: e.target.value })}
                placeholder="e.g., HH-2024-001"
              />
              <p className="text-xs text-muted-foreground">Must be unique for each household</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="head_of_family">Head of Family *</Label>
              <Input
                id="head_of_family"
                value={formData.head_of_family}
                onChange={(e) => setFormData({ ...formData, head_of_family: e.target.value })}
                placeholder="e.g., Juan Dela Cruz"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="purok">Purok *</Label>
              <Select value={formData.purok} onValueChange={(value) => setFormData({ ...formData, purok: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Purok 1">Purok 1</SelectItem>
                  <SelectItem value="Purok 2">Purok 2</SelectItem>
                  <SelectItem value="Purok 3">Purok 3</SelectItem>
                  <SelectItem value="Purok 4">Purok 4</SelectItem>
                  <SelectItem value="Purok 5">Purok 5</SelectItem>
                  <SelectItem value="Purok 6">Purok 6</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., 123 Main Street, Barangay Central"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_number">Contact Number</Label>
              <Input
                id="contact_number"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                placeholder="e.g., 09171234567"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="family_members">Number of Family Members *</Label>
              <Input
                id="family_members"
                type="number"
                min="1"
                value={formData.family_members}
                onChange={(e) => setFormData({ ...formData, family_members: Number.parseInt(e.target.value) || 1 })}
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
            <Button onClick={handleAdd}>Register Household</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Household</DialogTitle>
            <DialogDescription>Update household information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="edit_household_number">Household Number *</Label>
              <Input
                id="edit_household_number"
                value={formData.household_number}
                onChange={(e) => setFormData({ ...formData, household_number: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_head_of_family">Head of Family *</Label>
              <Input
                id="edit_head_of_family"
                value={formData.head_of_family}
                onChange={(e) => setFormData({ ...formData, head_of_family: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_purok">Purok *</Label>
              <Select value={formData.purok} onValueChange={(value) => setFormData({ ...formData, purok: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Purok 1">Purok 1</SelectItem>
                  <SelectItem value="Purok 2">Purok 2</SelectItem>
                  <SelectItem value="Purok 3">Purok 3</SelectItem>
                  <SelectItem value="Purok 4">Purok 4</SelectItem>
                  <SelectItem value="Purok 5">Purok 5</SelectItem>
                  <SelectItem value="Purok 6">Purok 6</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_address">Address *</Label>
              <Input
                id="edit_address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_contact_number">Contact Number</Label>
              <Input
                id="edit_contact_number"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_family_members">Number of Family Members *</Label>
              <Input
                id="edit_family_members"
                type="number"
                min="1"
                value={formData.family_members}
                onChange={(e) => setFormData({ ...formData, family_members: Number.parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setError(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
