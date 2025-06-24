import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const formatIfExcelDate = (val) => {
  if (!val) return val;

  // If val is a valid ISO date string
  if (typeof val === 'string' && !isNaN(Date.parse(val))) {
    const d = new Date(val);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  // If numeric Excel date serial number
  if (!isNaN(val) && val > 30000) {
    return new Date((val - 25569) * 86400 * 1000).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return val; // fallback
};

const formatIfExcelTime = (val) => {
  if (!val) return val;

  // If val is a valid ISO date string
  if (typeof val === 'string' && !isNaN(Date.parse(val))) {
    const d = new Date(val);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  // If numeric Excel time fraction
  if (!isNaN(val) && val < 1) {
    const totalSeconds = Math.round(val * 86400);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  return val; // fallback
};

const InvoiceHistory = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const vendor = state?.vendor;

  const [invoices, setInvoices] = useState([]);
  const [allRawData, setAllRawData] = useState([]);
  const [loading, setLoading] = useState(true);

const sheetUrl = `http://localhost:3001/get-invoices?mode=get-invoices&sheet=${encodeURIComponent(vendor)}`;


useEffect(() => {
  if (vendor) {
    fetch(sheetUrl)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched invoice data:", data); // ← Helpful for debugging

        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data.invoices)
          ? data.invoices
          : [];

        setAllRawData(rows);

        const grouped = {};
        rows.forEach((entry) => {
          const key = `${entry.Date}|${entry.Time}|${entry['Order No']}`;
          if (!grouped[key]) {
            grouped[key] = {
              info: {
                Date: entry.Date,
                Time: entry.Time,
                Vendor: entry.Vendor,
                'Order No': entry['Order No'],
                Subtotal: entry.Subtotal,
                Cartage: entry.Cartage,
                'Prev Balance': entry['Prev Balance'],
                'Grand Total': entry['Grand Total'],
              },
              products: [],
            };
          }
          grouped[key].products.push(entry);
        });

        setInvoices(Object.values(grouped));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching invoices:', err);
        setLoading(false);
      });
  }
}, [vendor]);


  // const overwriteInvoice = async (group) => {
  //   const orderNo = group.info['Order No'];
  //   const filtered = allRawData.filter(row => row['Order No'] !== orderNo);

  //   const newData = group.products.map(prod => ({
  //     ...prod,
  //     Date: new Date().toLocaleDateString('en-IN'),
  //     Time: new Date().toLocaleTimeString('en-IN'),
  //   }));

  //   const allUpdated = [...filtered, ...newData];

  //   try {
  //     const res = await fetch(`http://localhost:3001/save-invoice?sheet=${vendor}`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ data: allUpdated }),
  //     });
  //     const json = await res.json();

  //     if (json.status === 'success') {
  //       alert('Invoice overwritten successfully.');
  //       window.location.reload();
  //     } else {
  //       alert('❌ Failed to overwrite invoice.');
  //     }
  //   } catch (err) {
  //     alert('❌ Error: ' + err.message);
  //   }
  // };

  return (
  <div className="p-6 bg-white min-h-screen">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold">Previous Invoices for: {vendor}</h2>
      <button
        onClick={() => navigate(-1)}
        className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600"
      >
        Back
      </button>
    </div>

    {loading ? (
      <p>Loading invoices...</p>
    ) : invoices.length === 0 ? (
      <p>No invoices found.</p>
    ) : (
      invoices.map((group, index) => (
        <div key={index} className="border mb-6 p-4 rounded shadow">
          <h3 className="font-bold text-lg mb-1">
            Invoice for {group.info.Vendor} – Order No: {group.info['Order No']}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Date: {formatIfExcelDate(group.info.Date)} | Time: {formatIfExcelTime(group.info.Time)}
          </p>

          <table className="min-w-full text-sm border mt-2 mb-4">
            <thead className="bg-gray-200">
              <tr>
                {[
                  'Model', 
                  'Image', 
                  'Client Name', 
                  'Challan No',    // <-- Added here
                  'Qty Ordered', 
                  'Qty Received', 
                  'Price', 
                  'Total'
                ].map((head) => (
                  <th key={head} className="px-2 py-1">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.products.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1">{item.Model}</td>
                  <td className="px-2 py-1">
                    {item.Image ? (
                      <img src={item.Image} alt="model" className="h-14 w-14 object-contain border" />
                    ) : 'N/A'}
                  </td>
                  <td className="px-2 py-1">{item['Client Name']}</td>
                  <td className="px-2 py-1">{item['Challan No']}</td> {/* <-- Added here */}
                  <td className="px-2 py-1">{item['Qty Ordered']}</td>
                  <td className="px-2 py-1">{item['Qty Received']}</td>
                  <td className="px-2 py-1">₹{item.Price}</td>
                  <td className="px-2 py-1 font-semibold">₹{item.Total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-sm font-semibold">
            <p>Subtotal: ₹{group.info.Subtotal}</p>
            <p>Cartage: ₹{group.info.Cartage}</p>
            <p>Previous Balance: ₹{group.info['Prev Balance']}</p>
            <p className="text-lg font-bold">Grand Total: ₹{group.info['Grand Total']}</p>
          </div>

          <div className="flex gap-2 mt-3">
            {/* Print button */}
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Print
            </button>
          </div>
        </div>
      ))
    )}
  </div>
);
};

export default InvoiceHistory;
