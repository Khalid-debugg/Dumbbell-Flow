export function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export interface MultiInvoiceRow {
  date: string
  typeText: string
  category: string
  description?: string
  amount: string
  prefix: string
}

export interface MultiInvoiceParams {
  gymName: string
  gymAddress?: string
  gymPhone?: string
  printDate: string
  rows: MultiInvoiceRow[]
  totalIncome: string
  totalExpenses: string
  net: string
  netPrefix: string
  isRTL: boolean
  labels: {
    receipt: string
    date: string
    type: string
    category: string
    description: string
    amount: string
    totalIncome: string
    totalExpenses: string
    net: string
  }
}

export function buildMultiInvoiceHTML(p: MultiInvoiceParams): string {
  const dir = p.isRTL ? 'rtl' : 'ltr'
  const refAlign = p.isRTL ? 'left' : 'right'

  const bodyRows = p.rows
    .map(
      (r) => `<tr>
      <td>${escHtml(r.date)}</td>
      <td>${escHtml(r.typeText)}</td>
      <td>${escHtml(r.category)}</td>
      <td class="desc">${r.description ? escHtml(r.description) : ''}</td>
      <td class="amt">${r.prefix}&nbsp;${escHtml(r.amount)}</td>
    </tr>`
    )
    .join('\n')

  return `<!DOCTYPE html>
<html dir="${dir}">
<head>
<meta charset="utf-8">
<title>Invoice</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #fff; color: #000; }
  .page { max-width: 720px; margin: 0 auto; padding: 48px; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 10px; }
  .gym-name { font-size: 20px; font-weight: 700; }
  .gym-sub { font-size: 12px; color: #555; margin-top: 3px; }
  .ref-block { text-align: ${refAlign}; flex-shrink: 0; }
  .receipt-label { font-size: 22px; font-weight: 700; text-transform: uppercase; }
  .rule-thick { border: none; border-top: 2px solid #000; margin: 14px 0 20px; }
  table { width: 100%; border-collapse: collapse; }
  thead th { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; color: #777; text-align: start; padding: 0 0 8px; border-bottom: 1px solid #000; }
  thead th.amt { text-align: end; }
  tbody td { font-size: 13px; padding: 9px 0; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  tbody td + td { padding-inline-start: 12px; }
  td.desc { color: #555; }
  td.amt, th.amt { text-align: end; white-space: nowrap; }
  tfoot td { padding: 8px 0; font-size: 13px; }
  tfoot td + td { padding-inline-start: 12px; }
  tfoot td.lbl { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #777; }
  tfoot tr.net td { border-top: 2px solid #000; padding-top: 10px; font-weight: 700; font-size: 14px; }
  tfoot tr.net td.lbl { font-size: 10px; }
  .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; border-top: 1px solid #e5e5e5; padding-top: 12px; }
  @media print { .page { max-width: 100%; padding: 24px; } }
</style>
</head>
<body>
<div class="page">
  <div class="top">
    <div>
      <div class="gym-name">${escHtml(p.gymName)}</div>
      ${p.gymAddress ? `<div class="gym-sub">${escHtml(p.gymAddress)}</div>` : ''}
      ${p.gymPhone ? `<div class="gym-sub" style="direction:ltr;display:inline-block">${escHtml(p.gymPhone)}</div>` : ''}
    </div>
    <div class="ref-block">
      <div class="receipt-label">${escHtml(p.labels.receipt)}</div>
    </div>
  </div>

  <hr class="rule-thick">

  <table>
    <thead>
      <tr>
        <th>${escHtml(p.labels.date)}</th>
        <th>${escHtml(p.labels.type)}</th>
        <th>${escHtml(p.labels.category)}</th>
        <th>${escHtml(p.labels.description)}</th>
        <th class="amt">${escHtml(p.labels.amount)}</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" class="lbl">${escHtml(p.labels.totalIncome)}</td>
        <td class="amt">${escHtml(p.totalIncome)}</td>
      </tr>
      <tr>
        <td colspan="4" class="lbl">${escHtml(p.labels.totalExpenses)}</td>
        <td class="amt">${escHtml(p.totalExpenses)}</td>
      </tr>
      <tr class="net">
        <td colspan="4" class="lbl">${escHtml(p.labels.net)}</td>
        <td class="amt">${p.netPrefix}&nbsp;${escHtml(p.net)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <span>DumbbellFlow</span>
    <span>${escHtml(p.printDate)}</span>
  </div>
</div>
</body>
</html>`
}
