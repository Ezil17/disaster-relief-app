"use client"

import { useState, useEffect } from "react"
import { Activity, Search, RefreshCw, Zap, Eye, Plus, Trash2 } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <header className="border-b bg-gradient-to-r from-card via-primary/10 to-secondary/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg ring-2 ring-primary/20 animate-pulse">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">ReliefTrack</h1>
                <p className="text-xs text-muted-foreground">Activity Monitor</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="gap-2 border-2 border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20"
            >
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Live Tracking</span>
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

      <main className="container mx-auto px-4 py-8">
        <Card className="overflow-hidden border-2 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Activity Log</CardTitle>
                  <CardDescription className="text-base">
                    Track all actions performed in the system in real-time
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={fetchLogs}
                variant="outline"
                size="icon"
                className="border-2 hover:bg-primary/10 bg-transparent"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by entity name or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-2 focus:border-primary"
                />
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-full border-2 lg:w-[180px]">
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
                <SelectTrigger className="w-full border-2 lg:w-[180px]">
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
              <Card className="border-2 bg-gradient-to-br from-primary/10 to-transparent">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{logs.length}</div>
                      <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                    </div>
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-transparent dark:border-emerald-900/50 dark:from-emerald-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-emerald-600">
                        {logs.filter((l) => l.action_type === "create").length}
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">Created</p>
                    </div>
                    <Plus className="h-8 w-8 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-transparent dark:border-blue-900/50 dark:from-blue-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-blue-600">
                        {logs.filter((l) => l.action_type === "update").length}
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">Updated</p>
                    </div>
                    <RefreshCw className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-transparent dark:border-red-900/50 dark:from-red-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-red-600">
                        {logs.filter((l) => l.action_type === "delete").length}
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">Deleted</p>
                    </div>
                    <Trash2 className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Table */}
            <div className="rounded-lg border-2 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Timestamp</TableHead>
                    <TableHead className="font-bold">Action</TableHead>
                    <TableHead className="font-bold">Entity Type</TableHead>
                    <TableHead className="font-bold">Entity Name</TableHead>
                    <TableHead className="font-bold">Performed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Loading activity logs...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        No activity logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-primary/5">
                        <TableCell className="text-sm font-medium text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{getActionBadge(log.action_type)}</TableCell>
                        <TableCell>{getEntityBadge(log.entity_type)}</TableCell>
                        <TableCell className="font-semibold">{log.entity_name}</TableCell>
                        <TableCell className="text-sm font-medium">{log.performed_by}</TableCell>
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
