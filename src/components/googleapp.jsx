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



