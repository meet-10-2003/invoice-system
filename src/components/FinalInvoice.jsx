import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { saveInvoiceToSheet, deletePreviousInvoice } from '../components/utils/saveToSheet';

const FinalInvoice = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { vendor, rows, orderNumber } = state || {};

  const [finalRows, setFinalRows] = useState([]);
  const [currentDate] = useState(new Date());

  const [cartage, setCartage] = useState(() => {
    const stored = sessionStorage.getItem(`cartage-${vendor}-${orderNumber}`);
    return stored !== null ? stored : 0;
  });

  const [previousBalance, setPreviousBalance] = useState(() => {
    const stored = sessionStorage.getItem(`prevBalance-${vendor}-${orderNumber}`);
    return stored !== null ? stored : 0;
  });

  const storageKey = `invoice-saved-${vendor}-${orderNumber}`;
  const [isSaved, setIsSaved] = useState(() => sessionStorage.getItem(storageKey) === 'true');

  const isMeterVendor = ['anuj - fabric vendor', 'vijay - fabric vendor'].includes(vendor?.toLowerCase());
  const isSeatVendor = ['x - sofa worker', 'y - sofa worker'].includes(vendor?.toLowerCase());
  const unitLabel = isMeterVendor ? ' (meters)' : isSeatVendor ? ' (seats)' : '';

  const formatDate = (value) => {
    if (typeof value === 'number') {
      const utc_days = Math.floor(value - 25569);
      const utc_value = utc_days * 86400;
      return new Date(utc_value * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (value instanceof Date) {
      return value.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return value;
  };

  const formatTime = (value) => {
    if (typeof value === 'number') {
      const totalSeconds = Math.round(value * 86400);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    if (value instanceof Date) {
      return value.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return value;
  };

  useEffect(() => {
    const savedStatus = sessionStorage.getItem(storageKey);
    setIsSaved(savedStatus === 'true');

    if (vendor && rows?.length > 0) {
      enrichRows();
    }
  }, [vendor, rows, orderNumber, storageKey]);

  const enrichRows = () => {
    const enriched = rows.map((row) => {
      const totalQuantity = Number(row.totalQuantity || 0);
      const quantityReceived = Number(row.quantityReceived || 0);
      const quantityLeft = totalQuantity - quantityReceived;
      const price = Number(row.price) || 0;
      const total = price * quantityReceived;

      return {
        ...row,
        totalQuantity,
        quantityReceived,
        quantityLeft,
        price,
        total,
        image: row.image || '',
        clientName: row.clientName || '',
      };
    });

    setFinalRows(enriched);
  };

  const subTotal = finalRows.reduce((sum, row) => sum + row.total, 0);
  const grandTotal = subTotal + parseFloat(cartage || 0) + parseFloat(previousBalance || 0);

  const handlePrint = () => window.print();

  const handleViewHistory = () => {
    navigate('/invoice-history', { state: { vendor } });
  };

  const handleSaveInvoice = async () => {
    const formattedDate = formatDate(currentDate);
    const formattedTime = formatTime(currentDate);

    const invoiceData = finalRows.map((row) => ({
      Date: formattedDate,
      Time: formattedTime,
      Vendor: vendor,
      "Order No": orderNumber || '',
      Model: row.model || '',
      "Date of Receipt": row.date || '',
      "Client Name": row.clientName || '',
      "Challan No": row.challan || '',
      "Qty Ordered": row.totalQuantity || '',
      "Qty Received": row.quantityReceived || '',
      "Qty Left": row.quantityLeft || '',
      "Quantity Unit": isMeterVendor ? "meters" : isSeatVendor ? "seats" : "",
      Price: row.price || '',
      Total: row.total || '',
      Image: row.image || '',
      Subtotal: subTotal,
      Cartage: cartage,
      "Prev Balance": previousBalance,
      "Grand Total": grandTotal,
    }));

    try {
      await saveInvoiceToSheet(invoiceData, vendor);
      sessionStorage.setItem(storageKey, 'true');
      setIsSaved(true);
      alert('Invoice saved to Google Sheet successfully!');
    } catch (err) {
      alert('Failed to save invoice.');
    }
  };

const handleSaveAgain = async () => {
  try {
    if (!orderNumber || !vendor) {
      alert('Missing Order Number or Vendor');
      return;
    }

    // Delete old invoice rows first
    await deletePreviousInvoice(orderNumber, vendor); // Pass orderNumber, not orderNo

    // Recalculate and enrich rows
    const enriched = finalRows.map((row) => {
      const totalQuantity = Number(row.totalQuantity || 0);
      const quantityReceived = Number(row.quantityReceived || 0);
      const quantityLeft = totalQuantity - quantityReceived;
      const price = Number(row.price) || 0;
      const total = price * quantityReceived;

      return {
        ...row,
        totalQuantity,
        quantityReceived,
        quantityLeft,
        price,
        total,
      };
    });

    const formattedDate = formatDate(currentDate);
    const formattedTime = formatTime(currentDate);

    const invoiceData = finalRows.map((row) => ({
  Date: formattedDate,
  Time: formattedTime,
  Vendor: vendor,
  "Order No": orderNumber || '',
  Model: row.model || '',
  "Date of Receipt": row.date || '',
  "Client Name": row.clientName || '',      // <-- Use exact keys
  "Challan No": row.challan || '',          // <-- Use exact keys
  "Qty Ordered": row.totalQuantity || '',
  "Qty Received": row.quantityReceived || '',
  "Qty Left": row.quantityLeft || '',
  "Quantity Unit": isMeterVendor ? "meters" : isSeatVendor ? "seats" : "",
  Price: row.price || '',
  Total: row.total || '',
  Image: row.image || '',
  Subtotal: subTotal,
  Cartage: cartage,
  "Prev Balance": previousBalance,
  "Grand Total": grandTotal,
}));


    await saveInvoiceToSheet(invoiceData, vendor);
    sessionStorage.setItem(storageKey, 'true');
    setIsSaved(true);
    alert('Previous invoice overwritten and new one saved!');
  } catch (err) {
    console.error(err);
    alert('Failed to overwrite invoice.');
  }
};



  return (
    <div className="px-6 py-8 bg-white min-h-screen">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide">Vendor: {vendor}</h1>
          <div className="text-sm text-gray-600 mt-1 space-y-1">
            <div>Date: {formatDate(currentDate)}</div>
            <div>Time: {formatTime(currentDate)}</div>
          </div>
        </div>

        <div className="text-right print:hidden space-y-2">
          {orderNumber && <div className="text-lg font-semibold">Order No: {orderNumber}</div>}

          <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
            Print Invoice
          </button>

          <button onClick={handleViewHistory} className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600">
            View {vendor ? vendor.split(' ')[0] : 'Vendor'} Invoices
          </button>

          <a
            href="https://docs.google.com/spreadsheets/d/1Lgw6pYZt9jDDXTrU6mLL-i7Qi5KaMooowxExai1pgCw/edit?gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700"
          >
            View Sheet
          </a>

          {!isSaved ? (
            <button onClick={handleSaveInvoice} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">
              Save Invoice
            </button>
          ) : (
            <button onClick={handleSaveAgain} className="bg-orange-600 text-white px-4 py-2 rounded shadow hover:bg-orange-700">
              Save Again (Overwrite)
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border shadow-md rounded-xl">
          <thead className="bg-gray-600 text-white text-sm uppercase">
            <tr>
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Model Name</th>
              <th className="px-4 py-3 text-left">Model Image</th>
              <th className="px-4 py-3 text-left">Date of Receipt</th>
              <th className="px-4 py-3 text-left">Client Name</th>
              <th className="px-4 py-3 text-left">Challan No</th>
              <th className="px-4 py-3 text-left">Qty Ordered{unitLabel}</th>
              <th className="px-4 py-3 text-left">Qty Received{unitLabel}</th>
              <th className="px-4 py-3 text-left">Qty Left{unitLabel}</th>
              <th className="px-4 py-3 text-left">Price (₹)</th>
              <th className="px-4 py-3 text-left">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {finalRows.map((row, index) => (
              <tr key={index} className="border-t text-sm">
                <td className="px-4 py-2">{index + 1}</td>
                <td className="px-4 py-2">{row.model}</td>
                <td className="px-4 py-2">
                  {row.image && (
                    <img src={row.image} alt={row.model} className="w-20 h-20 object-contain border rounded" />
                  )}
                </td>
                <td className="px-4 py-2">{row.date}</td>
                <td className="px-4 py-2">{row.clientName}</td>
                <td className="px-4 py-2">{row.challan}</td>
                <td className="px-4 py-2">{row.totalQuantity}</td>
                <td className="px-4 py-2">{row.quantityReceived}</td>
                <td className="px-4 py-2">{row.quantityLeft}</td>
                <td className="px-4 py-2">₹{row.price}</td>
                <td className="px-4 py-2 font-semibold">₹{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="max-w-md ml-auto mt-6 space-y-3 text-sm">
        <div className="flex justify-between font-semibold border-b pb-1">
          <span>Sub Total</span>
          <span>₹{subTotal}</span>
        </div>

        <div className="flex justify-between items-center">
          <label htmlFor="cartage">Cartage (₹)</label>
          <input
            id="cartage"
            type="number"
            value={cartage}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= 0 || e.target.value === '') {
                setCartage(e.target.value);
                sessionStorage.setItem(`cartage-${vendor}-${orderNumber}`, e.target.value);
              }
            }}
            className="w-28 border px-2 py-1 rounded text-right"
          />
        </div>

        <div className="flex justify-between items-center">
          <label htmlFor="previous">Previous Balance (₹)</label>
          <input
            id="previous"
            type="number"
            value={previousBalance}
            onChange={(e) => {
              setPreviousBalance(e.target.value);
              sessionStorage.setItem(`prevBalance-${vendor}-${orderNumber}`, e.target.value);
            }}
            className="w-28 border px-2 py-1 rounded text-right"
          />
        </div>

        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Grand Total</span>
          <span>₹{grandTotal}</span>
        </div>
      </div>
    </div>
  );
};

export default FinalInvoice;
