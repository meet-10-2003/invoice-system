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
    return stored !== null ? stored : '';
  });

  const [previousBalance, setPreviousBalance] = useState(() => {
    const stored = sessionStorage.getItem(`prevBalance-${vendor}-${orderNumber}`);
    return stored !== null ? stored : 0;
  });


  const delayKey = `delayShown-${vendor}-${orderNumber}`;
  const [showPrevBalanceValue, setShowPrevBalanceValue] = useState(() =>
    sessionStorage.getItem(delayKey) === 'true'
  );

  const [modalContent, setModalContent] = useState(null);
  const [isSaving, setIsSaving] = useState(false);


  const [isOpeningHistory, setIsOpeningHistory] = useState(false);




const Modal = ({ title, message, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleOkClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-zinc-200 p-6 rounded-lg shadow-lg w-[520px] mx-auto">
        <h2 className="text-xl uppercase font-bold mb-3 text-center">{title}</h2>
        <p className="mb-4 text-center">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={handleOkClick}
            disabled={isLoading}
            className={`px-6 py-2 w-20 h-10 cursor-pointer rounded font-semibold flex items-center justify-center
              ${isLoading ? 'bg-blue-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : null}
            {isLoading ? '' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};




  useEffect(() => {
    if (!showPrevBalanceValue) {
      const timeout = setTimeout(() => {
        setShowPrevBalanceValue(true);
        sessionStorage.setItem(delayKey, 'true');
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [showPrevBalanceValue, delayKey]);
















  const storageKey = `invoice-saved-${vendor}-${orderNumber}`;
  const [isSaved, setIsSaved] = useState(() => sessionStorage.getItem(storageKey) === 'true');


  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey) === 'true';
    setIsSaved(saved);
  }, [vendor, orderNumber]);


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





  const extractOrderNumber = (orderStr = '') => {
    const str = String(orderStr);
    // Match if there's a space, dash, or both before the number at the end
    const match = str.match(/[\s-]+(\d{1,})$/);
    return match ? parseInt(match[1], 10) : null;
  };





  useEffect(() => {
    const savedStatus = sessionStorage.getItem(storageKey);
    setIsSaved(savedStatus === 'true');

    if (vendor && rows?.length > 0) {
      enrichRows();
    }
  }, [vendor, rows, orderNumber, storageKey]);




  useEffect(() => {
    const fetchPreviousCarryForward = async () => {
      try {
        const res = await fetch(`https://invoice-proxy.onrender.com/get-invoices?sheet=${encodeURIComponent(vendor)}`);
        const data = await res.json();

        const allRows = Array.isArray(data)
          ? data
          : Array.isArray(data.invoices)
            ? data.invoices
            : [];

        const currentOrderNum = extractOrderNumber(String(orderNumber));
        if (isNaN(currentOrderNum)) {
          console.log("❗ Couldn't extract valid order number from:", orderNumber);
          return;
        }

        const previousOrderNum = currentOrderNum - 1;
        const orderPrefix = String(orderNumber).replace(/[-\s]*\d+$/, '').trim();

        const previousOrder = allRows.find(r => {
          const rOrder = String(r?.["Order No"] || '');
          const rNum = extractOrderNumber(rOrder);
          const rPrefix = rOrder.replace(/[-\s]*\d+$/, '').trim();

          return rNum === previousOrderNum && rPrefix === orderPrefix;
        });

        if (previousOrder) {
          const grandTotal = parseFloat(previousOrder["Grand Total"]) || 0;
          const paid = parseFloat(previousOrder["Amount Paid"]) || 0;
          const carry = (grandTotal - paid).toFixed(2);

          setPreviousBalance(carry);
          sessionStorage.setItem(`prevBalance-${vendor}-${orderNumber}`, carry);

          console.log(`💰 Carry Forward from ${previousOrder["Order No"]}: ₹${carry}`);
        } else {
          console.log("❗ No previous order found.");
          setPreviousBalance("0.00");
        }
      } catch (err) {
        console.error("❌ Carry Forward Fetch Error:", err);
      }
    };

    if (vendor && orderNumber && !sessionStorage.getItem(`prevBalance-${vendor}-${orderNumber}`)) {
      fetchPreviousCarryForward();
    } else {
      setPreviousBalance(sessionStorage.getItem(`prevBalance-${vendor}-${orderNumber}`) || "0.00");
    }

  }, [vendor, orderNumber, isSaved]);













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


  const [amountPaid, setAmountPaid] = useState(() => {
    const stored = sessionStorage.getItem(`amountPaid-${vendor}-${orderNumber}`);
    return stored !== null ? stored : '';
  });


  useEffect(() => {
    const stored = sessionStorage.getItem(`amountPaid-${vendor}-${orderNumber}`);
    setAmountPaid(stored !== null ? stored : '');
  }, [vendor, orderNumber]);





  const carryForwardAmount = (grandTotal - parseFloat(amountPaid || 0)).toFixed(2);





  const handlePrint = () => window.print();

  const handleViewHistory = () => {
    setIsOpeningHistory(true);
    setTimeout(() => {
      navigate('/invoice-history', { state: { vendor } });
    }, 1300); // small delay so UI can show the spinner
  };


  const handleSaveInvoice = async () => {
    setIsSaving(true);
    const now = new Date();
    const formattedDate = formatDate(now);
    const formattedTime = formatTime(now);


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
      "Amount Paid": amountPaid || '',
      "Carry Forward Amount": carryForwardAmount || '',

    }));

    try {
      await saveInvoiceToSheet(invoiceData, vendor);
      sessionStorage.setItem(storageKey, 'true');
      setIsSaved(true);
      setModalContent({
        title: 'Invoice Saved Successfully',
        message: 'The invoice was successfully saved to the Google Sheet. All entered details have been recorded securely.',
      });

    } catch (err) {
      setModalContent({
        title: 'Oops! Something Went Wrong',
        message: 'The invoice could not be saved to Google Sheets due to an unexpected issue. Please refresh the page or try again later.',
      });


    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAgain = async () => {
    setIsSaving(true);
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

      const now = new Date();
      const formattedDate = formatDate(now);
      const formattedTime = formatTime(now);


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
        "Amount Paid": amountPaid || '',
        "Carry Forward Amount": carryForwardAmount || '',

      }));


      await saveInvoiceToSheet(invoiceData, vendor);
      sessionStorage.setItem(storageKey, 'true');
      setIsSaved(true);
      setModalContent({
        title: 'Invoice Successfully Overwritten',
        message: 'The existing invoice has been overwritten with the new details and saved to your Google Sheet.',
      });

    } catch (err) {
      console.error(err);
      setModalContent({
        title: 'Oops! Something Went Wrong',
        message: 'The invoice could not be saved to Google Sheets due to an unexpected issue. Please refresh the page or try again later.',
      });

    } finally {
      setIsSaving(false);
    }
  };



  return (
    <div className="px-6 py-8 bg-white min-h-screen">
      <div className="mb-6">
        <div>
          <div className='flex justify-between w-full'>
            <h1 className="text-2xl font-bold uppercase tracking-wide heading-2 text-style">Vendor: {vendor}</h1>
            <div className='heading-2 text-style'>{orderNumber && <div className="text-lg font-semibold">Order No: {orderNumber}</div>}</div>
          </div>
          <div className="text-md text-gray-600 mt-1 space-y-1 heading-2">
            <div>Date: {formatDate(currentDate)}</div>
            <div>Time: {formatTime(currentDate)}</div>
          </div>
        </div>

        <div className="flex gap-4 justify-self-end print:hidden">


          <button onClick={handlePrint} className="bg-blue-600 cursor-pointer uppercase font-semibold button-style text-white px-4 py-2 rounded shadow hover:bg-blue-700">
            Print Invoice
          </button>

          {isOpeningHistory ? (
            <div className="flex items-center justify-center gap-2 rounded cursor-pointer text-white bg-yellow-600 font-semibold px-4 py-2 w-[270px] button-style text-center shadow">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <h3 className='text-center'>OPENING...</h3>
            </div>
          ) : (
            <button onClick={handleViewHistory} className="bg-yellow-500 uppercase cursor-pointer font-semibold button-style text-white px-4 py-2 rounded shadow hover:bg-yellow-600 w-[270px]">
              View {vendor ? vendor.split(' ')[0] : 'Vendor'} Invoices
            </button>
          )}


          <a
            href="https://docs.google.com/spreadsheets/d/1Lgw6pYZt9jDDXTrU6mLL-i7Qi5KaMooowxExai1pgCw/edit?gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-600 button-style text-white uppercase font-semibold px-4 py-2 rounded shadow hover:bg-purple-700"
          >
            View Sheet
          </a>

          {isSaving ? (
            <div className="flex items-center rounded button-style justify-center gap-2 cursor-pointer text-white bg-red-800 font-semibold px-4 py-2 w-[250px] text-center">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <h3 className='text-center'>SAVING INVOICE...</h3>
            </div>
          ) : !isSaved ? (
            <button onClick={handleSaveInvoice} className="bg-green-600 cursor-pointer uppercase font-semibold text-white px-4 py-2 button-style rounded shadow hover:bg-green-700 w-[250px]">
              Save Invoice
            </button>
          ) : (
            <button onClick={handleSaveAgain} className="bg-orange-600 cursor-pointer uppercase font-semibold text-white px-4 py-2 button-style rounded shadow hover:bg-orange-700 w-[250px]">
              Save Again (Overwrite)
            </button>
          )}

        </div>
      </div>

      <div className="overflow-x-auto table-style">
        <table className="min-w-full bg-white border shadow-md rounded-xl ">
          <thead className="bg-slate-500 text-white text-sm uppercase ">
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
                <td className="px-4 py-2 font-[600]">{index + 1}</td>
                <td className="px-4 py-2 font-[700] text-lg tracking-tight heading-2 uppercase max-w-[150px]">{row.model}</td>
                <td className="px-4 py-2">
                  {row.image && (
                    <img src={row.image} alt={row.model} className="w-24 h-24 object-contain transform transition-all duration-500 scale-[0.9] hover:scale-[1.1] z-10 cursor-pointer" />
                  )}
                </td>
                <td className="px-4 py-2 font-[700] text-lg">{row.date}</td>
                <td className="px-4 py-2 font-[700] text-lg">{row.clientName}</td>
                <td className="px-4 py-2 font-[700] text-lg">{row.challan}</td>
                <td className="px-4 py-2 font-[700] text-lg">{row.totalQuantity}</td>
                <td className="px-4 py-2 font-[700] text-lg">{row.quantityReceived}</td>
                <td className="px-4 py-2 font-[700] text-lg">{row.quantityLeft}</td>
                <td className="px-4 py-2 font-[700] text-lg">₹{row.price}</td>
                <td className="px-4 py-2 font-[700] text-lg">₹{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="max-w-md flex flex-col justify-self-end px-8 py-4 border mt-6 space-y-3 text-sm table-style bg-zinc-100">
        <div className="flex relative justify-between font-semibold pb-1">
          <span className='text-lg uppercase tracking-tight '>Sub Total</span>
          <span className='text-lg tracking-tight'>₹{subTotal}</span>
          <span className='h-[2px] top-[100%] right-0 w-full bg-black absolute'></span>
        </div>

        <div className="flex relative justify-between items-center font-semibold ">
          <label htmlFor="cartage" className='text-md uppercase'>Cartage (₹)</label>
          <input
            id="cartage"
            // type="number"
            // placeholder='0'
            value={cartage}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= 0 || e.target.value === '') {
                setCartage(e.target.value);
                sessionStorage.setItem(`cartage-${vendor}-${orderNumber}`, e.target.value);
              }
            }}
            className="w-28 border-none outline-none px-2 py-1 text-right"
          />
          <span className='h-[2px] top-[100%] right-0 w-16 bg-black absolute'></span>
        </div>





        <div className="flex justify-between items-center relative ">
          <label htmlFor="previous" className='text-md uppercase font-semibold'>Previous Balance (₹)</label>
          <input
            id="previous"
            // type="number"
            readOnly
            value={showPrevBalanceValue ? previousBalance : ''}
            onChange={(e) => {
              setPreviousBalance(e.target.value);
              sessionStorage.setItem(`prevBalance-${vendor}-${orderNumber}`, e.target.value);
            }}
            className="w-28 border-none cursor-not-allowed font-semibold outline-none px-2 py-1 text-right"
          />
          <span className='h-[2px] top-[100%] right-0 w-16 bg-black absolute'></span>
        </div>


        <p className="text-xs text-gray-500 mt-1">
          Auto-filled from last invoice: Grand Total - Amount Paid
        </p>





        <div className="flex justify-between text-lg font-semibold uppercase pt-2 relative">
          <span className='tracking-tight'>Grand Total</span>
          <span className='tracking-tight'>₹{grandTotal}</span>
          <span className='h-[2px] bottom-[100%] right-0 w-full bg-black absolute'></span>
        </div>



        <div className="flex justify-between items-center relative">
          <label htmlFor="amountPaid" className='text-md uppercase font-semibold'>Amount Paid (₹)</label>
          <input
            id="amountPaid"
            // type="number"
            // placeholder='0'
            value={amountPaid}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || parseFloat(val) >= 0) {
                setAmountPaid(val);
                sessionStorage.setItem(`amountPaid-${vendor}-${orderNumber}`, val);
              }
            }}
            className="w-28 border-none font-semibold outline-none px-2 py-1 text-right"
          />
          <span className='h-[2px] top-[100%] right-0 w-16 bg-black absolute'></span>
        </div>

        <div className="flex justify-between text-lg font-bold pt-2 text-blue-700 relative">
          <span>C/F Amount</span>
          <span>₹{carryForwardAmount}</span>
          <span className='h-[2px] bottom-[100%] right-0 w-full bg-blue-700 absolute'></span>
        </div>

      </div>


      {modalContent && (
        <Modal
          title={modalContent.title}
          message={modalContent.message}
          onClose={() => setModalContent(null)}
        />
      )}

    </div>
  );
};

export default FinalInvoice;
