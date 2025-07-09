import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyFMsOEmoq7UXPLUOaa05JiCAKiIvQAGqgl-O_6NHmnxNF3KPbsfj0iMlY92p6pp-ao/exec';

app.use(cors());
app.use(express.json());

/**
 * ✅ Save invoice to Google Sheet
 */
app.post('/save-invoice', async (req, res) => {
  const sheet = req.query.sheet;
  if (!sheet) return res.status(400).json({ error: 'Missing sheet name' });

  try {
    const response = await fetch(`${SCRIPT_URL}?sheet=${encodeURIComponent(sheet)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Error saving invoice:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * ✅ Get invoices from Google Sheet (🛠️ FIXED: added `mode=get-invoices`)
 */
app.get('/get-invoices', async (req, res) => {
  const sheet = req.query.sheet;
  if (!sheet) return res.status(400).json({ error: 'Missing sheet name' });

  const url = `${SCRIPT_URL}?mode=get-invoices&sheet=${encodeURIComponent(sheet)}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch (jsonErr) {
      console.error('❌ Invalid JSON from Apps Script:', text);
      res.status(500).json({ error: 'Invalid JSON from Apps Script' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * ✅ Delete previous invoice (used in "Save Again")
 */
app.post('/delete-invoice', async (req, res) => {
  const { orderNo, vendor } = req.body;

  if (!orderNo || !vendor) {
    return res.status(400).json({ success: false, message: 'Missing orderNo or vendor' });
  }

  try {
    const response = await fetch(
      `${SCRIPT_URL}?mode=delete&Order%20No=${encodeURIComponent(orderNo)}&vendor=${encodeURIComponent(vendor)}`
    );

    const result = await response.json();
    if (result.success) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete on backend' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting' });
  }
});






/**
 * ✅ Save job sheet data to Google Sheet
 */
const JOB_SHEET_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx1u6Z2lLkJoUo8HlVAKrbBK197VO-W-uSohS7hFShY_UBFZK5Fcu3P7qja-rUf8b4/exec';

app.post('/save-job-sheet', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'Invalid job sheet data' });
    }

    const response = await fetch(JOB_SHEET_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save',
        rows
      })
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error('Save Job Sheet Error:', err);
    res.status(500).json({ error: 'Internal server error during save' });
  }
});




/**
 * ✅ Delete previous job sheet rows (used before overwrite)
 */
app.post('/delete-job-sheet', async (req, res) => {
  try {
    const { orderNumber } = req.body;

    if (!orderNumber) {
      return res.status(400).json({ success: false, message: 'Missing orderNumber' });
    }

    const response = await fetch(JOB_SHEET_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        orderNumber
      })
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error('Delete Job Sheet Error:', err);
    res.status(500).json({ error: 'Internal server error during delete' });
  }
});







app.post('/notify-transition', (req, res) => {
  const { page } = req.body;
  if (page === 'invoice') {
    console.log('🧾 Shifted to Invoice Page');
  } else if (page === 'job-sheet') {
    console.log('📄 Shifted to Job Sheet Page');
  }
  res.json({ success: true });
});





/**
 * ✅ Start the server
 */
app.listen(PORT, () => {
  console.log(`🚀 Server running at https://invoice-proxy.onrender.com`);
});
