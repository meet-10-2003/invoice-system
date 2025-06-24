import React, { useEffect, useState } from 'react';
import SearchBar from './SearchBar';
import ModelSearch from './ModelSearch';
import { useNavigate } from 'react-router-dom';

const InvoicePage = () => {
  const [selectedVendor, setSelectedVendor] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [productRows, setProductRows] = useState([]);
  const navigate = useNavigate();

  const goToJobSheetPage = async () => {
    try {
      await fetch('https://invoice-proxy.onrender.com/notify-transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'job-sheet' }),
      });
    } catch (error) {
      console.error('Failed to notify backend:', error);
    }

    sessionStorage.clear(); // reset session data
    navigate('/job-sheet');
  };



  const isMeterVendor = ['anuj - fabric vendor', 'vijay - fabric vendor'].includes(selectedVendor.trim().toLowerCase());
  const isSeatVendor = ['x - sofa worker', 'y - sofa worker'].includes(selectedVendor.trim().toLowerCase());

  useEffect(() => {
    const savedData = sessionStorage.getItem('invoiceData');
    if (savedData) {
      const { vendor, rows, orderNumber } = JSON.parse(savedData);
      setSelectedVendor(vendor);
      setProductRows(rows);
      setOrderNumber(orderNumber || '');
      setShowTable(!!vendor);
    }


  }, []);


  const handleVendorSelect = (vendor) => {
    const initialRow = [createEmptyRow(1)];

    setSelectedVendor(vendor);
    setShowTable(true);
    setProductRows(initialRow);

    sessionStorage.setItem('invoiceData', JSON.stringify({
      vendor,
      rows: initialRow,
      // orderNumber: '',
      from: 'invoice',
    }));
  };

  const handleVendorClear = () => {
    setSelectedVendor('');
    setShowTable(false);
    setProductRows([]);

    const saved = sessionStorage.getItem('invoiceData');
    if (saved) {
      const { orderNumber } = JSON.parse(saved);
      sessionStorage.setItem('invoiceData', JSON.stringify({
        vendor: '',
        rows: [],
        // orderNumber: orderNumber || '',
      }));
    }
  };

  const createEmptyRow = (id) => ({
    id,
    model: '',
    date: '',
    clientName: '',
    challan: '',
    totalQuantity: '',
    quantityReceived: '',
    quantityLeft: '',
    image: '',
    price: '',
  });

  const handleModelSelect = (index, modelObj) => {
    const updatedRows = [...productRows];
    const selectedModel = modelObj.name.trim();

    let firstTotalQty = 0;
    let totalReceived = 0;

    productRows.forEach((row, idx) => {
      if (row.model === selectedModel) {
        if (firstTotalQty === 0 && row.totalQuantity && idx !== index) {
          firstTotalQty = parseFloat(row.totalQuantity || 0);
        }
        if (idx !== index) {
          totalReceived += parseFloat(row.quantityReceived || 0);
        }
      }
    });

    const remainingQty = Math.max(firstTotalQty - totalReceived, 0);

    if (remainingQty > 0) {
      alert(`Remaining quantity for ${selectedModel} is auto-filled as ${remainingQty}`);
    }

    updatedRows[index] = {
      ...updatedRows[index],
      model: selectedModel,
      image: modelObj.image || '',
      price: modelObj.price || '',
      totalQuantity: remainingQty > 0 ? String(remainingQty) : '',
    };

    setProductRows(updatedRows);
  };

  const handleInputChange = (index, field, value) => {
    const updatedRows = [...productRows];
    const row = { ...updatedRows[index], [field]: value };

    if (field === 'quantityReceived') {
      const qtyOrdered = parseFloat(row.totalQuantity) || 0;
      const qtyReceived = parseFloat(value) || 0;
      if (qtyReceived > qtyOrdered) {
        alert('Quantity Received cannot be greater than Quantity Ordered!');
        return;
      }
      row.quantityLeft = Math.max(qtyOrdered - qtyReceived, 0).toFixed(2);
    }

    if (field === 'totalQuantity') {
      const qtyOrdered = parseFloat(value) || 0;
      const qtyReceived = parseFloat(row.quantityReceived) || 0;
      row.quantityLeft = Math.max(qtyOrdered - qtyReceived, 0).toFixed(2);
    }

    updatedRows[index] = row;
    setProductRows(updatedRows);
  };

  const handleAddRow = () => {
    setProductRows((prev) => [...prev, createEmptyRow(prev.length + 1)]);
  };

  const handleDeleteRow = (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this row?');
    if (confirmed) {
      setProductRows((prev) => prev.filter((row) => row.id !== id));
    }
  };

  const handleGenerate = () => {
    if (!orderNumber.trim()) {
      alert('Please enter the Order Number.');
      return;
    }

    for (const row of productRows) {
      if (!row.date || !row.clientName.trim() || !row.quantityReceived || !row.totalQuantity) {
        alert('Please fill all required fields (Date, Qty Ordered, Qty Received, and Client Name) in every row.');
        return;
      }
    }

    const updatedRows = productRows.map((row) => {
      const qtyOrdered = parseFloat(row.totalQuantity) || 0;
      const qtyReceived = parseFloat(row.quantityReceived) || 0;
      const qtyLeft = Math.max(qtyOrdered - qtyReceived, 0);
      return {
        ...row,
        quantityLeft: qtyLeft.toFixed(2),
      };
    });

    sessionStorage.setItem('invoiceData', JSON.stringify({
      vendor: selectedVendor,
      rows: updatedRows,
      orderNumber,
    }));

    navigate('/final-invoice', {
      state: {
        vendor: selectedVendor,
        rows: updatedRows,
        orderNumber,
        from: 'invoice',
      },
    });
  };

  const handleLogout = () => {
    alert('You are logging off');
    sessionStorage.removeItem('invoiceData');
    navigate('/');
  };

  const handleViewHistory = () => {
    if (!selectedVendor) {
      alert('Please select a vendor to view their invoices.');
      return;
    }
    navigate('/invoice-history', { state: { vendor: selectedVendor } });
  };

  return (
    <div className="px-4 py-6 bg-white min-h-screen relative">
      <div className="absolute top-4 left-4 flex items-center space-x-3">
        <h4 className="font-bold text-xl tracking-tight">Order Number:</h4>
        <input
          type="text"
          value={orderNumber}
          onChange={(e) => {
            setOrderNumber(e.target.value);
            const saved = sessionStorage.getItem('invoiceData');
            if (saved) {
              const data = JSON.parse(saved);
              sessionStorage.setItem('invoiceData', JSON.stringify({
                ...data,
                orderNumber: e.target.value,
              }));
            }
          }}
          className="border px-2 cursor-pointer rounded text-sm w-28 font-[600] tracking-tight outline-none border-b-2"
        />
      </div>

      <div className="absolute top-4 right-4 flex items-center space-x-3">
        <button
          onClick={handleLogout}
          className="bg-red-600 tracking-tight font-bold uppercase text-white px-6 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>


      <div className="mb-6 absolute top-20 right-4 flex items-center space-x-3">
        <button
          onClick={goToJobSheetPage}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Go to JobSheet Page
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-6 text-center uppercase tracking-wide">Bill Generator</h1>

      <div className="flex items-center space-x-4 mb-4 justify-center">
        {selectedVendor ? (
          <div className="flex items-center space-x-3">
            <div className="text-lg font-semibold text-gray-700">{selectedVendor} Data</div>
            <button
              onClick={handleVendorClear}
              className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
            >
              Change Vendor
            </button>
          </div>
        ) : (
          <SearchBar onVendorSelect={handleVendorSelect} onVendorClear={handleVendorClear} />
        )}
      </div>

      <button
        onClick={handleViewHistory}
        className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm"
      >
        View {selectedVendor.split(' ')[0]} Invoices
      </button>

      {showTable && (
        <div className="mt-10 overflow-x-auto min-h-[500px]">
          <table className="min-w-full bg-white rounded-xl shadow-md border">
            <thead className="bg-gray-500 text-gray-100 uppercase text-sm">
              <tr>
                <th className="px-4 py-3 text-left">S.No</th>
                <th className="px-4 py-3 text-left">Model Name</th>
                <th className="px-4 py-3 text-left">Date of Receipt</th>
                <th className="px-4 py-3 text-left">Client Name</th>
                <th className="px-4 py-3 text-left">Receipt Challan No</th>
                <th className="px-4 py-3 text-left">
                  Qty Ordered {isMeterVendor && '(in meters)'} {isSeatVendor && '(in seats)'}
                </th>
                <th className="px-4 py-3 text-left">
                  Qty Received {isMeterVendor && '(in meters)'} {isSeatVendor && '(in seats)'}
                </th>
                <th className="px-4 py-3 text-left">Qty Left</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((row, index) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">
                    <ModelSearch
                      vendor={selectedVendor}
                      value={row.model}
                      onSelect={(model) => handleModelSelect(index, model)}
                      selectedModels={productRows.map((r) => r.model).filter((m, i) => i !== index)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => handleInputChange(index, 'date', e.target.value)}
                      className="border px-2 py-1 rounded w-full"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Client Name"
                      value={row.clientName}
                      onChange={(e) => handleInputChange(index, 'clientName', e.target.value)}
                      className="border px-2 py-1 rounded w-full"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Challan No"
                      value={row.challan}
                      onChange={(e) => handleInputChange(index, 'challan', e.target.value)}
                      className="border px-2 py-1 rounded w-full"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Total Quantity"
                      value={row.totalQuantity}
                      onChange={(e) => handleInputChange(index, 'totalQuantity', e.target.value)}
                      className="border px-2 py-1 rounded w-full"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Qty Received"
                      value={row.quantityReceived}
                      onChange={(e) => handleInputChange(index, 'quantityReceived', e.target.value)}
                      className="border px-2 py-1 rounded w-full"
                    />
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    {row.quantityLeft || ''}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 text-center">
            <button
              onClick={handleAddRow}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Row
            </button>
          </div>

          {productRows.length > 0 && (
            <div className="mt-4 text-center">
              <button
                onClick={handleGenerate}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Generate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoicePage;
