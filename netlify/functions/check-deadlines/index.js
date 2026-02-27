const formatDaysLabel = (days) => {
  if (days < 0) return `${Math.abs(days)} dni po terminie!`;
  if (days === 0) return "dzisiaj!";
  if (days === 1) return "jutro";
  return `za ${days} dni`;
};

const buildEmailHtml = (notifications) => {
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
    .join("");

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
  </div>`;
};

exports.handler = async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseServiceKey || !resendApiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Missing env vars",
          hasSupabaseKey: !!supabaseServiceKey,
          hasResendKey: !!resendApiKey,
          hasSupabaseUrl: !!supabaseUrl,
        }),
      };
    }

    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/get_pending_notifications`;

    const rpcRes = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });

    if (!rpcRes.ok) {
      const err = await rpcRes.text();
      return { statusCode: 500, body: `Supabase error: ${err}` };
    }

    const notifications = await rpcRes.json();

    if (!notifications || notifications.length === 0) {
      return { statusCode: 200, body: "No notifications to send today" };
    }

    // Group by guardian email
    const byEmail = new Map();
    for (const n of notifications) {
      const existing = byEmail.get(n.guardian_email) || [];
      existing.push(n);
      byEmail.set(n.guardian_email, existing);
    }

    let sent = 0;
    const errors = [];

    for (const [email, items] of byEmail) {
      const urgentCount = items.filter((i) => i.days_until <= 7).length;
      const subject =
        urgentCount > 0
          ? `[Pilne] ${urgentCount} termin${urgentCount === 1 ? "" : "ów"} wymaga uwagi — Kunagone Serwisy`
          : `${items.length} nadchodzący${items.length === 1 ? "" : "ch"} termin${items.length === 1 ? "" : "ów"} — Kunagone Serwisy`;

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
      });

      if (res.ok) {
        sent++;
      } else {
        const errText = await res.text();
        errors.push(`${email}: ${errText}`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ sent, total: byEmail.size, errors }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message, stack: err.stack }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
