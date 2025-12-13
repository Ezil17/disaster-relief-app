import { createClient } from "@/lib/supabase/client"

type ActivityLogData = {
  action_type: "create" | "update" | "delete"
  entity_type: "inventory" | "household" | "distribution"
  entity_id: string
  entity_name: string
  performed_by: string
  details?: Record<string, unknown>
}

export async function logActivity(data: ActivityLogData) {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("activity_logs").insert([
      {
        ...data,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error("[v0] Activity log error:", error)
    }
  } catch (err) {
    console.error("[v0] Activity log failed:", err)
  }
}
