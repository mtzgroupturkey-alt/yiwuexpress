/**
 * Auto-Pilot HTML Email Templates
 * Generates styled responsive HTML email notifications for:
 * 1. Daily Executive Briefing
 * 2. Critical Alert Notification
 * 3. Human Approval Request (with direct Cockpit links)
 * 4. Weekly Autonomous Summary
 */

export function renderExecutiveBriefingEmail(params: {
  companyName: string;
  date: string;
  briefingMarkdown: string;
  costUsd: number;
  kpis: {
    revenue24h: number;
    openOrders: number;
    exceptionsCount: number;
    stockoutRisks: number;
  };
  cockpitUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Auto-Pilot Executive Briefing</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; padding: 24px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; font-family: monospace; }
    .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 20px 24px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
    .kpi-card { background: #ffffff; padding: 12px 16px; border-radius: 8px; border: 1px solid #cbd5e1; }
    .kpi-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
    .kpi-val { font-size: 18px; font-weight: 800; color: #0f172a; font-family: monospace; }
    .content { padding: 24px; font-size: 14px; line-height: 1.6; color: #334155; }
    .briefing-box { background: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; border-radius: 4px; font-size: 13px; white-space: pre-wrap; }
    .footer { padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 10px 20px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 13px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 ${params.companyName} Auto-Pilot</h1>
      <p>DAILY OPERATIONAL BRIEFING &bull; ${params.date} &bull; Cycle Cost: $${params.costUsd.toFixed(4)}</p>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">24h Revenue</div>
        <div class="kpi-val">$${params.kpis.revenue24h.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Open Orders</div>
        <div class="kpi-val">${params.kpis.openOrders}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Order Exceptions</div>
        <div class="kpi-val" style="color: ${params.kpis.exceptionsCount > 0 ? '#e11d48' : '#0f172a'};">${params.kpis.exceptionsCount}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Stockout Risks (7d)</div>
        <div class="kpi-val">${params.kpis.stockoutRisks}</div>
      </div>
    </div>
    <div class="content">
      <h3 style="margin-top:0; font-size:15px; color:#0f172a;">Executive Synthesis</h3>
      <div class="briefing-box">${params.briefingMarkdown}</div>
      <center>
        <a href="${params.cockpitUrl}" class="btn">Open Auto-Pilot Cockpit &rarr;</a>
      </center>
    </div>
    <div class="footer">
      Autonomous business management powered by Council &amp; Algorithmic Root Cause &bull; ${params.companyName}
    </div>
  </div>
</body>
</html>`;
}

export function renderApprovalRequestEmail(params: {
  companyName: string;
  approvalId: string;
  action: string;
  department: string;
  risk: string;
  rationale: string;
  slaDeadline: string;
  approveUrl: string;
  rejectUrl: string;
  cockpitUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Action Signoff Required</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #b45309; padding: 20px 24px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 800; }
    .content { padding: 24px; font-size: 14px; line-height: 1.6; }
    .meta-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .meta-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .meta-table td:first-child { font-weight: 700; color: #64748b; width: 140px; }
    .button-group { margin: 24px 0 12px; display: flex; gap: 12px; }
    .btn-approve { background: #059669; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 13px; display: inline-block; }
    .btn-reject { background: #dc2626; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 13px; display: inline-block; margin-left: 10px; }
    .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Auto-Pilot Action Approval Required</h1>
    </div>
    <div class="content">
      <p style="margin-top:0;">The Auto-Pilot Council has proposed an action that exceeds autonomous execution limits and requires explicit operator signoff.</p>
      
      <table class="meta-table">
        <tr><td>Action Proposed</td><td><strong style="font-family:monospace;">${params.action}</strong></td></tr>
        <tr><td>Department</td><td>${params.department.toUpperCase()}</td></tr>
        <tr><td>Risk Classification</td><td><span style="color:#b45309; font-weight:bold;">${params.risk.toUpperCase()}</span></td></tr>
        <tr><td>Rationale</td><td>${params.rationale}</td></tr>
        <tr><td>SLA Deadline</td><td>${params.slaDeadline} (2 Hours)</td></tr>
        <tr><td>Approval ID</td><td><code style="font-family:monospace;">${params.approvalId}</code></td></tr>
      </table>

      <div style="margin-top:20px;">
        <a href="${params.approveUrl}" class="btn-approve">✅ Approve Action</a>
        <a href="${params.rejectUrl}" class="btn-reject">❌ Reject Action</a>
      </div>

      <p style="font-size:12px; color:#64748b; margin-top:20px;">
        Or review the full impact vector directly in the <a href="${params.cockpitUrl}">Auto-Pilot Approvals Inbox</a>.
      </p>
    </div>
    <div class="footer">
      Auto-Pilot Security Gate &bull; Unapproved actions expire automatically after SLA deadline.
    </div>
  </div>
</body>
</html>`;
}
