//only view invoice is not working

// function doPost(e) {
//   try {
//     const sheetName = e.parameter.sheet || 'Sheet1';
//     const ss = SpreadsheetApp.getActiveSpreadsheet();
//     const sheet = ss.getSheetByName(sheetName);
//     const data = JSON.parse(e.postData.contents).data;

//     if (!data || data.length === 0) throw new Error("No data provided");

//     const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
//     const allRows = sheet.getDataRange().getValues();
//     const orderNo = data[0]["Order No"];

//     // 🔄 Overwrite logic: delete all rows with matching Order No
//     for (let i = allRows.length - 1; i > 0; i--) {
//       const currentOrderNo = allRows[i][headers.indexOf("Order No")];
//       if (currentOrderNo === orderNo) {
//         sheet.deleteRow(i + 1); // +1 because getDataRange is 0-based, sheet is 1-based
//       }
//     }

//     // ➕ Append new rows
//     data.forEach(row => {
//       const rowData = headers.map(header => row[header] ?? '');
//       sheet.appendRow(rowData);
//     });

//     return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
//       .setMimeType(ContentService.MimeType.JSON);
//   } catch (error) {
//     return ContentService.createTextOutput(JSON.stringify({
//       status: 'error',
//       message: error.message
//     })).setMimeType(ContentService.MimeType.JSON);
//   }
// }


// function doGet(e) {
//   const mode = e.parameter.mode;

//   if (mode === 'delete') {
//     const orderNo = e.parameter["Order No"];
//     const vendor = e.parameter.vendor;

//     if (!orderNo || !vendor) {
//       return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Missing orderNo or vendor" }))
//         .setMimeType(ContentService.MimeType.JSON);
//     }

//     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(vendor);
//     const data = sheet.getDataRange().getValues();

//     const headerRow = data[0];
//     const orderNoIndex = headerRow.indexOf("Order No");

//     if (orderNoIndex === -1) {
//       return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Header not found" }))
//         .setMimeType(ContentService.MimeType.JSON);
//     }

//     let rowsDeleted = 0;
//     for (let i = data.length - 1; i > 0; i--) {
//       if (data[i][orderNoIndex] === orderNo) {
//         sheet.deleteRow(i + 1);
//         rowsDeleted++;
//       }
//     }

//     return ContentService.createTextOutput(JSON.stringify({ success: true, rowsDeleted }))
//       .setMimeType(ContentService.MimeType.JSON);
//   }

//   return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Invalid mode" }))
//     .setMimeType(ContentService.MimeType.JSON);
// }






// everything is working


function doPost(e) {
    try {
        const sheetName = e.parameter.sheet || 'Sheet1';
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ss.getSheetByName(sheetName);
        const data = JSON.parse(e.postData.contents).data;

        if (!data || data.length === 0) throw new Error("No data provided");

        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const allRows = sheet.getDataRange().getValues();
        const orderNo = data[0]["Order No"];

        // 🔄 Overwrite logic: delete all rows with matching Order No
        for (let i = allRows.length - 1; i > 0; i--) {
            const currentOrderNo = allRows[i][headers.indexOf("Order No")];
            if (currentOrderNo === orderNo) {
                sheet.deleteRow(i + 1); // +1 because getDataRange is 0-based, sheet is 1-based
            }
        }

        // ➕ Append new rows
        data.forEach(row => {
            const rowData = headers.map(header => row[header] ?? '');
            sheet.appendRow(rowData);
        });

        return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: error.message
        })).setMimeType(ContentService.MimeType.JSON);
    }
}


function doGet(e) {
    const mode = e.parameter.mode;

    if (mode === 'delete') {
        const orderNo = e.parameter["Order No"];
        const vendor = e.parameter.vendor;

        if (!orderNo || !vendor) {
            return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Missing orderNo or vendor" }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(vendor);
        const data = sheet.getDataRange().getValues();

        const headerRow = data[0];
        const orderNoIndex = headerRow.indexOf("Order No");

        if (orderNoIndex === -1) {
            return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Header not found" }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        let rowsDeleted = 0;
        for (let i = data.length - 1; i > 0; i--) {
            if (data[i][orderNoIndex] === orderNo) {
                sheet.deleteRow(i + 1);
                rowsDeleted++;
            }
        }

        return ContentService.createTextOutput(JSON.stringify({ success: true, rowsDeleted }))
            .setMimeType(ContentService.MimeType.JSON);
    }

    // ✅ ADD THIS: Handle get-invoices mode
    if (mode === 'get-invoices') {
        const sheetName = e.parameter.sheet || 'Sheet1';
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

        if (!sheet) {
            return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Sheet not found" }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        const data = sheet.getDataRange().getValues();
        const headers = data.shift(); // Remove and keep header row

        const jsonData = data.map(row => {
            const rowObj = {};
            headers.forEach((header, index) => {
                rowObj[header] = row[index];
            });
            return rowObj;
        });

        return ContentService.createTextOutput(JSON.stringify(jsonData))
            .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Invalid mode" }))
        .setMimeType(ContentService.MimeType.JSON);
}


// JOB SHEET




// function doPost(e) {
//   try {
//     const requestData = JSON.parse(e.postData.contents);
//     const rows = requestData.rows; // ✅ Extract the array

//     if (!rows || !Array.isArray(rows)) {
//       throw new Error("Missing or invalid 'rows' array.");
//     }

//     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
//     rows.forEach(row => {
//       sheet.appendRow([
//         row.date,
//         row.orderNumber,
//         row.clientName,
//         row.model,
//         row.vendor,
//         row.description,
//         row.price,
//         row.image,
//         row.quantity,
//         row.selected ? "Selected" : "Not Selected"
//       ]);
//     });

//     return ContentService.createTextOutput(JSON.stringify({ success: true }))
//       .setMimeType(ContentService.MimeType.JSON);
//   } catch (err) {
//     return ContentService.createTextOutput(JSON.stringify({
//       success: false,
//       message: err.message
//     })).setMimeType(ContentService.MimeType.JSON);
//   }
// }



































// all working with view order





// import express from 'express';
// import cors from 'cors';

// const app = express();
// const PORT = 3001;

// const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSzjSgNJ3NiCZoX7whKeGKuCoebqhezy5QS81jEdh9FWNrctf7sua9-8PhRLBLvgDK/exec';



// app.use(cors());
// app.use(express.json());

// /**
//  * ✅ Save invoice to Google Sheet
//  */
// app.post('/save-invoice', async (req, res) => {
//   const sheet = req.query.sheet;
//   if (!sheet) return res.status(400).json({ error: 'Missing sheet name' });

//   console.log('🧾 Shifted to Invoice'); // ✅ Add this line

//   try {
//     const response = await fetch(`${SCRIPT_URL}?sheet=${encodeURIComponent(sheet)}`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(req.body),
//     });

//     const data = await response.json();
//     res.json(data);
//   } catch (err) {
//     console.error('Error saving invoice:', err);
//     res.status(500).json({ status: 'error', message: err.message });
//   }
// });


// /**
//  * ✅ Get invoices from Google Sheet (🛠️ FIXED: added `mode=get-invoices`)
//  */
// app.get('/get-invoices', async (req, res) => {
//   const sheet = req.query.sheet;
//   if (!sheet) return res.status(400).json({ error: 'Missing sheet name' });

//   const url = `${SCRIPT_URL}?mode=get-invoices&sheet=${encodeURIComponent(sheet)}`;

//   try {
//     const response = await fetch(url);
//     const text = await response.text();

//     try {
//       const data = JSON.parse(text);
//       res.json(data);
//     } catch (jsonErr) {
//       console.error('❌ Invalid JSON from Apps Script:', text);
//       res.status(500).json({ error: 'Invalid JSON from Apps Script' });
//     }
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch invoices' });
//   }
// });

// /**
//  * ✅ Delete previous invoice (used in "Save Again")
//  */
// app.post('/delete-invoice', async (req, res) => {
//   const { orderNo, vendor } = req.body;

//   if (!orderNo || !vendor) {
//     return res.status(400).json({ success: false, message: 'Missing orderNo or vendor' });
//   }

//   try {
//     const response = await fetch(
//       `${SCRIPT_URL}?mode=delete&Order%20No=${encodeURIComponent(orderNo)}&vendor=${encodeURIComponent(vendor)}`
//     );

//     const result = await response.json();
//     if (result.success) {
//       res.status(200).json({ success: true });
//     } else {
//       res.status(500).json({ success: false, message: 'Failed to delete on backend' });
//     }
//   } catch (error) {
//     console.error('Server error:', error);
//     res.status(500).json({ success: false, message: 'Server error while deleting' });
//   }
// });





// /**
//  * ✅ Save job sheet data to Google Sheet
//  */
// const JOB_SHEET_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxBAFsmLKpxoqV9VN6sqp1l5LXRMYg2pd21Uve-VEq_Xu_plhC2v_JTOW0i3m2NX1CF/exec';

// app.post('/save-job-sheet', async (req, res) => {
//   console.log('📝 Shifted to Job Sheet'); // ✅ Add this
//   console.log('📦 Received job sheet data:', req.body);

//   try {
//     const response = await fetch(JOB_SHEET_SCRIPT_URL, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(req.body),
//     });

//     const text = await response.text();
//     console.log('📨 Response from Apps Script:', text);

//     try {
//       const data = JSON.parse(text);
//       res.json(data);
//     } catch (jsonErr) {
//       console.error('❌ JSON parse error:', jsonErr.message);
//       return res.status(500).json({ error: 'Invalid JSON from Apps Script', raw: text });
//     }
//   } catch (err) {
//     console.error('❌ Failed to POST to Apps Script:', err.message);
//     return res.status(500).json({ error: err.message });
//   }
// });



// /**
//  * ✅ Delete previous job sheet rows (used before overwrite)
//  */
// app.post('/delete-job-sheet', async (req, res) => {
//   const { orderNumber, vendor } = req.body;

//   if (!orderNumber || !vendor) {
//     return res.status(400).json({ success: false, message: 'Missing orderNumber or vendor' });
//   }

//   try {
//     const deleteUrl = `${JOB_SHEET_SCRIPT_URL}?mode=delete&Order%20No=${encodeURIComponent(orderNumber)}&vendor=${encodeURIComponent(vendor)}`;
//     const response = await fetch(deleteUrl);
//     const text = await response.text();

//     try {
//       const data = JSON.parse(text);
//       res.json(data);
//     } catch (jsonErr) {
//       console.error('❌ Invalid JSON from Apps Script:', text);
//       res.status(500).json({ success: false, error: 'Invalid JSON from Apps Script', raw: text });
//     }
//   } catch (err) {
//     console.error('❌ Failed to delete job sheet:', err.message);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });












// app.post('/notify-transition', (req, res) => {
//   const { page } = req.body;
//   if (page === 'invoice') {
//     console.log('🧾 Shifted to Invoice Page');
//   } else if (page === 'job-sheet') {
//     console.log('📄 Shifted to Job Sheet Page');
//   }
//   res.json({ success: true });
// });










// /**
//  * ✅ Start the server
//  */
// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });





















































//



// import express from 'express';
// import cors from 'cors';

// const app = express();
// const PORT = 3001;

// const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSzjSgNJ3NiCZoX7whKeGKuCoebqhezy5QS81jEdh9FWNrctf7sua9-8PhRLBLvgDK/exec';



// app.use(cors());
// app.use(express.json());

// /**
//  * ✅ Save invoice to Google Sheet
//  */
// app.post('/save-invoice', async (req, res) => {
//   const sheet = req.query.sheet;
//   if (!sheet) return res.status(400).json({ error: 'Missing sheet name' });

//   try {
//     const response = await fetch(`${SCRIPT_URL}?sheet=${encodeURIComponent(sheet)}`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(req.body),
//     });

//     const data = await response.json();
//     res.json(data);
//   } catch (err) {
//     console.error('Error saving invoice:', err);
//     res.status(500).json({ status: 'error', message: err.message });
//   }
// });

// /**
//  * ✅ Get invoices from Google Sheet (🛠️ FIXED: added `mode=get-invoices`)
//  */
// app.get('/get-invoices', async (req, res) => {
//   const sheet = req.query.sheet;
//   if (!sheet) return res.status(400).json({ error: 'Missing sheet name' });

//   const url = `${SCRIPT_URL}?mode=get-invoices&sheet=${encodeURIComponent(sheet)}`;

//   try {
//     const response = await fetch(url);
//     const text = await response.text();

//     try {
//       const data = JSON.parse(text);
//       res.json(data);
//     } catch (jsonErr) {
//       console.error('❌ Invalid JSON from Apps Script:', text);
//       res.status(500).json({ error: 'Invalid JSON from Apps Script' });
//     }
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch invoices' });
//   }
// });

// /**
//  * ✅ Delete previous invoice (used in "Save Again")
//  */
// app.post('/delete-invoice', async (req, res) => {
//   const { orderNo, vendor } = req.body;

//   if (!orderNo || !vendor) {
//     return res.status(400).json({ success: false, message: 'Missing orderNo or vendor' });
//   }

//   try {
//     const response = await fetch(
//       `${SCRIPT_URL}?mode=delete&Order%20No=${encodeURIComponent(orderNo)}&vendor=${encodeURIComponent(vendor)}`
//     );

//     const result = await response.json();
//     if (result.success) {
//       res.status(200).json({ success: true });
//     } else {
//       res.status(500).json({ success: false, message: 'Failed to delete on backend' });
//     }
//   } catch (error) {
//     console.error('Server error:', error);
//     res.status(500).json({ success: false, message: 'Server error while deleting' });
//   }
// });





// /**
//  * ✅ Save job sheet data to Google Sheet
//  */
// const JOB_SHEET_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1ErrP36lK96-B1dcpD9CPwaPH2BAAX2RSiW3Xsmq6BL1etv2Bxo5DcyyiMAIUXpDy/exec';

// app.post('/save-job-sheet', async (req, res) => {
//   try {
//     console.log('📦 Received job sheet data:', req.body);

//     const response = await fetch(JOB_SHEET_SCRIPT_URL, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(req.body),
//     });

//     const text = await response.text(); // Get raw response
//     console.log('📨 Response from Apps Script:', text);

//     try {
//       const data = JSON.parse(text);
//       res.json(data);
//     } catch (jsonErr) {
//       console.error('❌ JSON parse error:', jsonErr.message);
//       return res.status(500).json({ error: 'Invalid JSON from Apps Script', raw: text });
//     }
//   } catch (err) {
//     console.error('❌ Failed to POST to Apps Script:', err.message);
//     return res.status(500).json({ error: err.message });
//   }
// });




















// /**
//  * ✅ Start the server
//  */
// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });

























// function doPost(e) {
//   try {
//     const requestData = JSON.parse(e.postData.contents);
//     const rows = requestData.rows;

//     if (!rows || !Array.isArray(rows)) {
//       throw new Error("Missing or invalid 'rows' array.");
//     }

//     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
//     const data = sheet.getDataRange().getValues();

//     // Assuming header is in row 1, data starts at row 2
//     // Columns mapping (0-based):
//     // 1: orderNumber (index 1)
//     // 4: vendor (index 4)

//     const orderNumberToDelete = rows[0].orderNumber;
//     const vendorSet = new Set(rows.map(r => r.vendor));

//     // Collect rows to delete (row numbers in sheet)
//     let rowsToDelete = [];
//     for (let i = 1; i < data.length; i++) { // start from 1 to skip header
//       const rowOrderNumber = data[i][1];
//       const rowVendor = data[i][4];

//       if (rowOrderNumber === orderNumberToDelete && vendorSet.has(rowVendor)) {
//         // Google Sheets rows are 1-based, plus +1 for header row offset
//         rowsToDelete.push(i + 1);
//       }
//     }

//     // Delete rows from bottom to top to avoid shifting issues
//     rowsToDelete.sort((a, b) => b - a);
//     rowsToDelete.forEach(rowNum => {
//       sheet.deleteRow(rowNum);
//     });

//     // Append new rows after deleting old ones
//     rows.forEach(row => {
//       sheet.appendRow([
//         row.date,
//         row.orderNumber,
//         row.clientName,
//         row.model,
//         row.vendor,
//         row.description,
//         row.price,
//         row.image,
//         row.quantity,
//         row.selected ? "Selected" : "Not Selected"
//       ]);
//     });

//     return ContentService.createTextOutput(JSON.stringify({ success: true }))
//       .setMimeType(ContentService.MimeType.JSON);
//   } catch (err) {
//     return ContentService.createTextOutput(JSON.stringify({
//       success: false,
//       message: err.message
//     })).setMimeType(ContentService.MimeType.JSON);
//   }
// }







// function doGet(e) {
//   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
//   const data = sheet.getDataRange().getValues();

//   const headers = data[0];
//   const rows = data.slice(1).map(row => {
//     const obj = {};
//     headers.forEach((key, i) => {
//       obj[key] = row[i];
//     });
//     return obj;
//   });

//   return ContentService.createTextOutput(JSON.stringify(rows))
//     .setMimeType(ContentService.MimeType.JSON);
// }























// google app script - best till now


// function doPost(e) {
//   try {
//     const requestData = JSON.parse(e.postData.contents);
//     const rows = requestData.rows;

//     if (!rows || !Array.isArray(rows)) {
//       throw new Error("Missing or invalid 'rows' array.");
//     }

//     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
//     const data = sheet.getDataRange().getValues();

//     // Assuming header is in row 1, data starts at row 2
//     // Columns mapping (0-based):
//     // 1: orderNumber (index 1)
//     // 4: vendor (index 4)

//     const orderNumberToDelete = rows[0].orderNumber;
//     const vendorSet = new Set(rows.map(r => r.vendor));

//     // Collect rows to delete (row numbers in sheet)
//     let rowsToDelete = [];
//     for (let i = 1; i < data.length; i++) { // start from 1 to skip header
//       const rowOrderNumber = data[i][1];
//       const rowVendor = data[i][4];

//       if (rowOrderNumber === orderNumberToDelete && vendorSet.has(rowVendor)) {
//         // Google Sheets rows are 1-based, plus +1 for header row offset
//         rowsToDelete.push(i + 1);
//       }
//     }

//     // Delete rows from bottom to top to avoid shifting issues
//     rowsToDelete.sort((a, b) => b - a);
//     rowsToDelete.forEach(rowNum => {
//       sheet.deleteRow(rowNum);
//     });

//     // Append new rows after deleting old ones
//     rows.forEach(row => {
//       sheet.appendRow([
//         row.date,
//         row.orderNumber,
//         row.clientName,
//         row.model,
//         row.vendor,
//         row.description,
//         row.price,
//         row.image,
//         row.quantity,
//         row.selected ? "Selected" : "Not Selected"
//       ]);
//     });

//     return ContentService.createTextOutput(JSON.stringify({ success: true }))
//       .setMimeType(ContentService.MimeType.JSON);
//   } catch (err) {
//     return ContentService.createTextOutput(JSON.stringify({
//       success: false,
//       message: err.message
//     })).setMimeType(ContentService.MimeType.JSON);
//   }
// }







// function doGet(e) {
//   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
//   const data = sheet.getDataRange().getValues();

//   const headers = data[0];
//   const rows = data.slice(1).map(row => {
//     const obj = {};
//     headers.forEach((key, i) => {
//       obj[key] = row[i];
//     });
//     return obj;
//   });

//   return ContentService.createTextOutput(JSON.stringify(rows))
//     .setMimeType(ContentService.MimeType.JSON);
// }








































// alos working one getting not selected also in edit 




/*    

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);

    const action = requestData.action;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');

if (action === 'delete') {
  const { orderNumber, vendor, model } = requestData;

  if (!orderNumber || !vendor || !model) {
    throw new Error("Missing orderNumber, vendor, or model");
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  const data = sheet.getDataRange().getValues();

  let rowsToDelete = [];

  for (let i = 1; i < data.length; i++) {
    const rowOrderNumber = data[i][1];
    const rowVendor = data[i][4];
    const rowModel = data[i][3];

    if (
      rowOrderNumber === orderNumber &&
      rowVendor === vendor &&
      rowModel === model
    ) {
      rowsToDelete.push(i + 1);
    }
  }

  rowsToDelete.sort((a, b) => b - a); // Delete bottom-up
  rowsToDelete.forEach(rowNum => sheet.deleteRow(rowNum));

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}


    if (action === 'save') {
      const rows = requestData.rows;
      if (!rows || !Array.isArray(rows)) {
        throw new Error("Missing or invalid 'rows' array.");
      }

      rows.forEach(row => {
        sheet.appendRow([
          row.date,
          row.orderNumber,
          row.clientName,
          row.model,
          row.vendor,
          row.description,
          row.price,
          row.image,
          row.quantity,
          row.selected ? "Selected" : "Not Selected"
        ]);
      });

      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    throw new Error("Unsupported action");
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}







function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  const data = sheet.getDataRange().getValues();

  const headers = data[0];
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((key, i) => {
      obj[key] = row[i];
    });
    return obj;
  });

  return ContentService.createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}


*/