import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch'; // if you're using Node 18+ and need fetch

const app = express();
const PORT = 3001;

// 🔗 Google Apps Script URLs
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJctj8Ihd6FwQJ6qjg-Me2J0AJkSRwSJWwltw18CDY9cldhlnIzmXJx4X6HC8j5F1c/exec';
const JOB_SHEET_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx1u6Z2lLkJoUo8HlVAKrbBK197VO-W-uSohS7hFShY_UBFZK5Fcu3P7qja-rUf8b4/exec';

const allowedOrigins = ['https://invoice-system-mu.vercel.app'];

app.use(express.json());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

const safeJson = async (res, response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('❌ Invalid JSON from Apps Script:', text);
    res.status(500).json({ error: 'Invalid JSON from Apps Script', raw: text });
    return null;
  }
};

// ✅ Save invoice
app.post('/save-invoice', async (req, res) => {
  const sheet = req.query.sheet;
  if (!sheet) return res.status(400).json({ error: 'Missing sheet name' });

  try {
    const response = await fetch(`${SCRIPT_URL}?sheet=${encodeURIComponent(sheet)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await safeJson(res, response);
    if (data) res.json(data);
  } catch (err) {
    console.error('❌ Error saving invoice:', err.message);
    res.status(502).json({ error: 'Apps Script fetch failed' });
  }
});

// ✅ Get invoices
app.get('/get-invoices', async (req, res) => {
  const sheet = req.query.sheet;
  if (!sheet) return res.status(400).json({ error: 'Missing sheet name' });

  try {
    const response = await fetch(`${SCRIPT_URL}?mode=get-invoices&sheet=${encodeURIComponent(sheet)}`);
    const data = await safeJson(res, response);
    if (data) res.json(data);
  } catch (err) {
    console.error('❌ Apps Script fetch failed:', err.message);
    res.status(502).json({ error: 'Apps Script fetch failed' });
  }
});

// ✅ Delete invoice
app.post('/delete-invoice', async (req, res) => {
  const { orderNo, vendor } = req.body;
  if (!orderNo || !vendor) {
    return res.status(400).json({ success: false, message: 'Missing orderNo or vendor' });
  }

  try {
    const response = await fetch(
      `${SCRIPT_URL}?mode=delete&Order%20No=${encodeURIComponent(orderNo)}&vendor=${encodeURIComponent(vendor)}`
    );

    const result = await safeJson(res, response);
    if (result?.success) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete on backend' });
    }
  } catch (error) {
    console.error('❌ Server error while deleting invoice:', error.message);
    res.status(502).json({ success: false, message: 'Failed to delete invoice' });
  }
});

// ✅ Get last order number
app.get('/last-order-number', async (req, res) => {
  const vendor = req.query.vendor;
  const sheetName = vendor?.trim();
  if (!vendor) return res.status(400).json({ error: 'Vendor is required' });

  try {
    const response = await fetch(`${SCRIPT_URL}?mode=get-invoices&sheet=${encodeURIComponent(sheetName)}`);
    const data = await safeJson(res, response);
    if (!data) return;

    const prefix = vendor.trim().split(' ')[0].toUpperCase();
    const orderNumbers = data
      .map(row => String(row["Order No"] || '').trim())
      .filter(order => order.toUpperCase().startsWith(prefix + ' -'))
      .map(order => parseInt(order.split(' - ')[1], 10))
      .filter(num => !isNaN(num));

    const max = orderNumbers.length ? Math.max(...orderNumbers) : 0;
    const nextOrderNo = `${prefix} - ${String(max + 1).padStart(2, '0')}`;

    res.json({ nextOrderNo });
  } catch (err) {
    console.error('❌ Error in /last-order-number:', err.message);
    res.status(502).json({ nextOrderNo: '' });
  }
});

// ✅ Save job sheet
app.post('/save-job-sheet', async (req, res) => {
  const { rows } = req.body;
  if (!rows || !Array.isArray(rows)) {
    return res.status(400).json({ error: 'Invalid job sheet data' });
  }

  try {
    const response = await fetch(JOB_SHEET_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', rows })
    });

    const data = await safeJson(res, response);
    if (data) res.json(data);
  } catch (err) {
    console.error('❌ Save Job Sheet Error:', err.message);
    res.status(502).json({ error: 'Job Sheet save failed' });
  }
});

// ✅ Delete job sheet
app.post('/delete-job-sheet', async (req, res) => {
  const { orderNumber } = req.body;
  if (!orderNumber) return res.status(400).json({ success: false, message: 'Missing orderNumber' });

  try {
    const response = await fetch(JOB_SHEET_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', orderNumber })
    });

    const data = await safeJson(res, response);
    if (data) res.json(data);
  } catch (err) {
    console.error('❌ Delete Job Sheet Error:', err.message);
    res.status(502).json({ error: 'Job Sheet delete failed' });
  }
});

// ✅ Simple notify route
app.post('/notify-transition', (req, res) => {
  const { page } = req.body;
  if (page === 'invoice') console.log('🧾 Shifted to Invoice Page');
  else if (page === 'job-sheet') console.log('📄 Shifted to Job Sheet Page');
  res.json({ success: true });
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at https://invoice-proxy.onrender.com`);
});
