import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const formatIfExcelDate = (val) => {
  if (!val) return val;
  if (typeof val === 'string' && !isNaN(Date.parse(val))) {
    const d = new Date(val);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  if (!isNaN(val) && val > 30000) {
    return new Date((val - 25569) * 86400 * 1000).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return val;
};

const formatIfExcelTime = (val) => {
  if (!val) return val;
  if (typeof val === 'string' && !isNaN(Date.parse(val))) {
    const d = new Date(val);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  if (!isNaN(val) && val < 1) {
    const totalSeconds = Math.round(val * 86400);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  return val;
};

const InvoiceHistory = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const vendor = state?.vendor;

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const sheetUrl = `https://invoice-proxy.onrender.com/get-invoices?mode=get-invoices&sheet=${encodeURIComponent(vendor)}`;

  useEffect(() => {
    if (vendor) {
      fetch(sheetUrl)
        .then((res) => res.json())
        .then((data) => {
          const rows = Array.isArray(data)
            ? data
            : Array.isArray(data.invoices)
              ? data.invoices
              : [];

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
                  'Amount Paid': entry['Amount Paid'] || 0,
                  'Carry Forward Amount': entry['Carry Forward Amount'] || 0,
                },
                products: [],
              };
            }
            grouped[key].products.push(entry);
          });

          setInvoices(Object.values(grouped).reverse());
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching invoices:', err);
          setLoading(false);
        });
    }
  }, [vendor]);

  const filteredInvoices = invoices.filter((group) => {
    const query = searchQuery.toLowerCase();
    const date = formatIfExcelDate(group.info.Date)?.toLowerCase() || '';
    const orderNo = (group.info['Order No'] || '').toString().toLowerCase();

    return date.includes(query) || orderNo.includes(query);
  });

  // Refs for each invoice block
  const invoiceRefs = useRef([]);
  invoiceRefs.current = filteredInvoices.map((_, i) => invoiceRefs.current[i] ?? React.createRef());

  const printInvoice = (ref) => {
    const printContents = ref.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {loading && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-800 via-slate-700 to-black overflow-hidden z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white border-solid"></div>
        </div>
      )}

      <div className="flex justify-between items-center mb-2 flex-wrap gap-4 print:hidden">
        <h2 className="text-xl font-bold heading-2 uppercase text-style">Previous Invoices for: {vendor}</h2>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-600 uppercase font-semibold text-white px-6 button-style cursor-pointer py-2 rounded shadow hover:bg-gray-700"
        >
          Back
        </button>
      </div>

      {/* Search Bar */}
      <div className="w-[560px] mb-8 mx-auto table-style rounded-[4px] print:hidden">
        <input
          type="text"
          placeholder="Search by Date or Order No"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border cursor-pointer border-gray-500 rounded-[4px] shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-700 transition-all duration-200 placeholder:uppercase placeholder:font-semibold placeholder:text-gray-500 text-[16px]"
        />
      </div>

      {loading ? (
        <p>Loading invoices...</p>
      ) : filteredInvoices.length === 0 ? (
        <p className="uppercase tracking-tight text-xl">No matching invoices found...</p>
      ) : (
        filteredInvoices.map((group, index) => (
          <div key={index} ref={invoiceRefs.current[index]} className="border mb-6 p-4 rounded shadow table-style">
            <div className="flex justify-between">
              <h3 className="font-bold text-lg mb-1 uppercase heading-2">Invoice for {group.info.Vendor}</h3>
              <p className="text-[16px] heading-2 text-gray-600 mb-2">
                Date: {formatIfExcelDate(group.info.Date)} | Time: {formatIfExcelTime(group.info.Time)}
              </p>
            </div>

            <h3 className="font-bold text-lg mb-1 uppercase heading-2">Order No: {group.info['Order No']}</h3>

            <table className="min-w-full border mt-2 mb-4 table-style">
              <thead className="bg-slate-500 text-white">
                <tr>
                  {['Model', 'Image', 'Client Name', 'Challan No', 'Qty Ordered', 'Qty Received', 'Price', 'Total'].map((head) => (
                    <th key={head} className="px-4 py-2 text-left text-md">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.products.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2 font-[700] text-lg tracking-tight heading-2 uppercase max-w-[230px]">{item.Model}</td>
                    <td className="px-4 py-2">
                      {item.Image ? (
                        <img
                          src={item.Image}
                          alt="model"
                          className="h-24 w-24 object-cover transform transition-all duration-500 scale-[0.9] hover:scale-[1.0] z-10 cursor-pointer"
                        />
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-2 font-[700] text-lg w-[200px]">{item['Client Name']}</td>
                    <td className="px-4 py-2 font-[700] text-lg">{item['Challan No']}</td>
                    <td className="px-4 py-2 font-[700] text-lg">{item['Qty Ordered']}</td>
                    <td className="px-4 py-2 font-[700] text-lg">{item['Qty Received']}</td>
                    <td className="px-4 py-2 font-[700] text-lg">₹{item.Price}</td>
                    <td className="px-4 py-2 font-[700] text-lg">₹{item.Total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-sm font-semibold space-y-1 border-2 w-fit pl-4 py-4 pr-10 table-style">
              <p className="uppercase text-lg">Subtotal: ₹ {group.info.Subtotal}</p>
              <p className="uppercase text-lg">Cartage: ₹ {group.info.Cartage}</p>
              <p className="uppercase text-lg">Previous Balance: ₹ {group.info['Prev Balance']}</p>
              <p className="uppercase text-lg">Grand Total: ₹ {group.info['Grand Total']}</p>
              <p className="uppercase text-lg">Amount Paid: ₹ {group.info['Amount Paid'] || 0}</p>
              <p className="text-lg font-bold uppercase text-blue-700">C/F Amount: ₹ {group.info['Carry Forward Amount'] || 0}</p>
            </div>

            <div className="flex gap-2 mt-3 print:hidden">
              <button
                onClick={() => printInvoice(invoiceRefs.current[index])}
                className="bg-blue-600 text-white px-6 py-2 uppercase font-semibold cursor-pointer rounded hover:bg-blue-700"
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
