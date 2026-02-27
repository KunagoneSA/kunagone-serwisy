import type { Config } from "@netlify/functions"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface NotificationRow {
  deadline_id: string
  deadline_title: string
  due_date: string
  days_until: number
  asset_name: string
  asset_identifier: string
  guardian_email: string
  guardian_name: string
}

function formatDaysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} dni po terminie!`
  if (days === 0) return "dzisiaj!"
  if (days === 1) return "jutro"
  return `za ${days} dni`
}

function buildEmailHtml(notifications: NotificationRow[]): string {
  const rows = notifications
    .map(
      (n) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px">${n.asset_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px">${n.deadline_title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px">${new Date(n.due_date).toLocaleDateString("pl-PL")}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:600;color:${n.days_until <= 7 ? "#dc2626" : n.days_until <= 30 ? "#d97706" : "#059669"}">${formatDaysLabel(n.days_until)}</td>
    </tr>`
    )
    .join("")

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto">
    <div style="background:#991b1b;padding:16px 24px;border-radius:12px 12px 0 0">
      <h1 style="color:#fff;font-size:18px;margin:0">Kunagone Serwisy — Powiadomienie</h1>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
      <p style="color:#475569;font-size:14px;margin:0 0 16px">Nadchodzące terminy wymagające uwagi:</p>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;border-bottom:2px solid #e2e8f0">Zasób</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;border-bottom:2px solid #e2e8f0">Termin</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;border-bottom:2px solid #e2e8f0">Data</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;border-bottom:2px solid #e2e8f0">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center">
        <a href="https://kunagone-serwisy.netlify.app" style="color:#d97706">Otwórz aplikację</a>
      </p>
    </div>
  </div>`
}

export default async function handler() {
  const supabaseUrl = Netlify.env.get("SUPABASE_URL") || Netlify.env.get("VITE_SUPABASE_URL")!
  const supabaseServiceKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const resendApiKey = Netlify.env.get("RESEND_API_KEY")!

  if (!supabaseServiceKey || !resendApiKey) {
    console.error("Missing env vars: SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY")
    return new Response("Missing config", { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get all pending notifications
  const { data, error } = await supabase.rpc("get_pending_notifications")

  if (error) {
    console.error("Error fetching notifications:", error)
    return new Response(JSON.stringify(error), { status: 500 })
  }

  const notifications = (data ?? []) as NotificationRow[]

  if (notifications.length === 0) {
    console.log("No notifications to send today")
    return new Response("No notifications")
  }

  // Group by guardian email
  const byEmail = new Map<string, NotificationRow[]>()
  for (const n of notifications) {
    const existing = byEmail.get(n.guardian_email) ?? []
    existing.push(n)
    byEmail.set(n.guardian_email, existing)
  }

  // Send one email per guardian
  let sent = 0
  for (const [email, items] of byEmail) {
    const urgentCount = items.filter((i) => i.days_until <= 7).length
    const subject = urgentCount > 0
      ? `[Pilne] ${urgentCount} termin${urgentCount === 1 ? "" : "ów"} wymaga uwagi — Kunagone Serwisy`
      : `${items.length} nadchodzący${items.length === 1 ? "" : "ch"} termin${items.length === 1 ? "" : "ów"} — Kunagone Serwisy`

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kunagone Serwisy <onboarding@resend.dev>",
        to: [email],
        subject,
        html: buildEmailHtml(items),
      }),
    })

    if (res.ok) {
      sent++
      console.log(`Email sent to ${email} (${items.length} deadlines)`)
    } else {
      const err = await res.text()
      console.error(`Failed to send to ${email}: ${err}`)
    }
  }

  console.log(`Done: ${sent}/${byEmail.size} emails sent`)
  return new Response(`Sent ${sent} emails`)
}

export const config: Config = {
  // Every day at 7:00 AM UTC (8:00 or 9:00 CET/CEST)
  schedule: "0 7 * * *",
}
