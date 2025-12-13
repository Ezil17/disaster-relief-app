"use client"

import { useState, useEffect } from "react"
import { Activity, Search, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

type ActivityLog = {
  id: string
  action_type: string
  entity_type: string
  entity_id: string | null
  entity_name: string
  performed_by: string
  details: Record<string, unknown> | null
  created_at: string
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [entityFilter, setEntityFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchLogs()

    // Set up real-time subscription
    const channel = supabase
      .channel("activity_logs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_logs",
        },
        (payload) => {
          setLogs((current) => [payload.new as ActivityLog, ...current])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    filterLogs()
  }, [logs, searchQuery, entityFilter, actionFilter])

  const fetchLogs = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (!error && data) {
      setLogs(data)
    }
    setIsLoading(false)
  }

  const filterLogs = () => {
    let filtered = logs

    if (entityFilter !== "all") {
      filtered = filtered.filter((log) => log.entity_type === entityFilter)
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action_type === actionFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (log) =>
          log.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.performed_by.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredLogs(filtered)
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "create":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Create</Badge>
      case "update":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Update</Badge>
      case "delete":
        return <Badge variant="destructive">Delete</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  const getEntityBadge = (entity: string) => {
    switch (entity) {
      case "inventory":
        return <Badge variant="outline">Inventory</Badge>
      case "household":
        return <Badge variant="outline">Household</Badge>
      case "distribution":
        return <Badge variant="outline">Distribution</Badge>
      default:
        return <Badge variant="outline">{entity}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">ReliefTrack</h1>
                <p className="text-xs text-muted-foreground">Disaster Relief Distribution System</p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Live Tracking
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
              <Button variant="ghost" className="rounded-none border-b-2 border-transparent">
                Distributions
              </Button>
            </Link>
            <Link href="/activity">
              <Button variant="ghost" className="rounded-none border-b-2 border-primary">
                Activity Log
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
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Track all actions performed in the system in real-time</CardDescription>
              </div>
              <Button onClick={fetchLogs} variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by entity name or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="household">Household</SelectItem>
                  <SelectItem value="distribution">Distribution</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Statistics */}
            <div className="mb-6 grid gap-4 sm:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{logs.length}</div>
                  <p className="text-sm text-muted-foreground">Total Activities</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {logs.filter((l) => l.action_type === "create").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Created</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {logs.filter((l) => l.action_type === "update").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Updated</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {logs.filter((l) => l.action_type === "delete").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Deleted</p>
                </CardContent>
              </Card>
            </div>

            {/* Activity Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity Name</TableHead>
                    <TableHead>Performed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Loading activity logs...
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No activity logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{getActionBadge(log.action_type)}</TableCell>
                        <TableCell>{getEntityBadge(log.entity_type)}</TableCell>
                        <TableCell className="font-medium">{log.entity_name}</TableCell>
                        <TableCell className="text-sm">{log.performed_by}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
