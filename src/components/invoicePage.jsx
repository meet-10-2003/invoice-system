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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPreparingLogout, setIsPreparingLogout] = useState(false);
  const [showVendorAlertModal, setShowVendorAlertModal] = useState(false);
  const [isAcknowledgingVendorAlert, setIsAcknowledgingVendorAlert] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showVendorChangeModal, setShowVendorChangeModal] = useState(false);
  const [isChangingVendor, setIsChangingVendor] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [isRedirecting, setIsRedirecting] = useState(false); // Add this state


  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [isClosingModal, setIsClosingModal] = useState(false);



  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [isDeletingRow, setIsDeletingRow] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);










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


const handleVendorSelect = async (vendor) => {
  const initialRow = [createEmptyRow(1)];

  setSelectedVendor(vendor);
  setShowTable(true);
  setProductRows(initialRow);

  try {
    const res = await fetch(`https://invoice-proxy.onrender.com/last-order-number?vendor=${encodeURIComponent(vendor)}`);
    const data = await res.json();
    const nextOrderNo = data.nextOrderNo || '';
    setOrderNumber(nextOrderNo);

    // ✅ Clear previous session storage values for this new invoice
    sessionStorage.removeItem(`invoice-saved-${vendor}-${nextOrderNo}`);
    sessionStorage.removeItem(`cartage-${vendor}-${nextOrderNo}`);
    sessionStorage.removeItem(`amountPaid-${vendor}-${nextOrderNo}`);
    sessionStorage.removeItem(`prevBalance-${vendor}-${nextOrderNo}`);
    sessionStorage.removeItem(`delayShown-${vendor}-${nextOrderNo}`);

    // ✅ Save fresh invoiceData
    sessionStorage.setItem('invoiceData', JSON.stringify({
      vendor,
      rows: initialRow,
      orderNumber: nextOrderNo,
      from: 'invoice',
    }));

  } catch (err) {
    console.error('Failed to fetch order number:', err);
    setOrderNumber('');
    sessionStorage.setItem('invoiceData', JSON.stringify({
      vendor,
      rows: initialRow,
      orderNumber: '',
      from: 'invoice',
    }));
  }
};



  const handleVendorClear = () => {
    setSelectedVendor('');
    setShowTable(false);
    setProductRows([]);
    setOrderNumber(''); // ✅ Reset state

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

    // Fill the current row
    updatedRows[index] = {
      ...updatedRows[index],
      model: selectedModel,
      image: modelObj.image || '',
      price: modelObj.price || '',
      totalQuantity: remainingQty > 0 ? String(remainingQty) : '',
    };

    setProductRows(updatedRows);

    if (remainingQty > 0) {
      setErrorModalMessage(`Remaining quantity for ${selectedModel} is auto-filled as ${remainingQty}`);
      setShowErrorModal(true);
    }
  };


  const handleInputChange = (index, field, value) => {
    const updatedRows = [...productRows];
    const row = { ...updatedRows[index], [field]: value };

    if (field === 'quantityReceived') {
      const qtyOrdered = parseFloat(row.totalQuantity) || 0;
      const qtyReceived = parseFloat(value) || 0;

      if (!row.totalQuantity || qtyOrdered === 0) {
        setErrorModalMessage('Please enter Quantity Ordered before entering Quantity Received.');
        setShowErrorModal(true);
        return;
      }

      if (qtyReceived > qtyOrdered) {
        setErrorModalMessage('Quantity Received cannot be greater than Quantity Ordered!');
        setShowErrorModal(true);
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
    setRowToDelete(id);
    setShowDeleteModal(true);
  };


  const handleGenerate = () => {
    // if (!orderNumber.trim()) {
    //   alert('Please enter the Order Number.');
    //   setShowErrorModal(true);
    //   return;
    // }

    for (const row of productRows) {
      if (!row.date || !row.clientName.trim() || !row.quantityReceived || !row.totalQuantity) {
        setErrorModalMessage('Please fill all required fields (Date, Quantity Ordered, Quantity Received and Client Name) in every row.');
        setShowErrorModal(true);
        return;

      }
    }

    setIsGenerating(true);
    setTimeout(() => {

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

      setIsGenerating(false);
    }, 1000); // optional delay to allow spinner animation
  };

  const handleLogout = () => {

    setIsPreparingLogout(false);
    setShowLogoutModal(true); // Show modal after short delay
  };

  const handleViewHistory = () => {
    if (!selectedVendor) {
      setShowVendorAlertModal(true);
      return;
    }

    sessionStorage.setItem('invoiceData', JSON.stringify({
      vendor: selectedVendor,
      rows: productRows,
      orderNumber,
      from: 'invoice',
    }));

    setIsLoadingHistory(true);
    setTimeout(() => {
      navigate('/invoice-history', { state: { vendor: selectedVendor } });
    }, 1500);
  };


  return (
    <div className="px-4 py-6 bg-zinc-200 h-screen relative">
      <div className="absolute top-4 left-4 flex items-center space-x-3 ">
        <h4 className="font-bold text-[24px] tracking-tight mt-1 text-style">ORDER NUMBER :</h4>
        <span className='h-1 w-40 bg-black absolute top-9 left-[12.7rem]'></span>
        <input
          type="text"
          placeholder='Enter Order Number'
          value={orderNumber}
          readOnly
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
          className="pl-1 mt-[6px] cursor-not-allowed rounded text-m w-44 font-[600] tracking-tight outline-none border-none"
        />
      </div>

      <div className="absolute top-4 right-4 flex items-center space-x-3 mt-1">
        <button
          onClick={handleLogout}
          className='logout-button button-style transition-all duration-300 text-white cursor-pointer rounded uppercase font-semibold px-4 py-2'
        >

          logout


        </button>

      </div>

      <div className='relative '>


        <div className="absolute top-20 justify-between w-full flex items-center">
          <button
            onClick={() => setShowConfirmModal(true)}
            className="jobsheet-button button-style text-white px-4 uppercase py-[0.5rem] rounded  font-semibold transition-all duration-300 cursor-pointer w-[220px] h-[40px]"
          >
            Go to JobSheet Page
          </button>



          <button
            onClick={handleViewHistory}
            disabled={isLoadingHistory}
            className="invoice-button button-style text-white px-3 py-[0.5rem] uppercase rounded  text-m font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center w-[260px] h-[40px] relative overflow-hidden"
          >
            {/* Fade text */}
            <span
              className={`transition-opacity duration-300 absolute inset-0 flex items-center justify-center ${isLoadingHistory ? 'opacity-0' : 'opacity-100'
                }`}
            >
              View {selectedVendor.split(' ')[0]} Invoices
            </span>

            {/* Spinner */}
            {isLoadingHistory && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>

        </div>
      </div>

      <h1 className="text-[32px] font-bold mb-6 text-center uppercase tracking-tight mt-[-10px] heading">INVOICE GENERATOR</h1>

      <div className="flex items-center justify-center ">
        {selectedVendor ? (
          <div className="flex items-center justify-between bg-white space-x-3 w-[576px] rounded-[8px] border-2 mt-4 relative button-style">
            <div className="text-[16px] pl-4 py-[0.5rem] font-semibold text-gray-700 cursor-not-allowed">{selectedVendor} DATA</div>
            <button
              // onClick={handleVendorClear}
              onClick={() => setShowVendorChangeModal(true)}
              className="change-button duration-300 transition-all right-0 text-white px-3 py-2 rounded-tr-[6px] rounded-br-[6px]  text-m uppercase font-semibold cursor-pointer absolute"
            >
              Change Vendor
            </button>
          </div>
        ) : (
          <SearchBar onVendorSelect={handleVendorSelect} onVendorClear={handleVendorClear} />
        )}
      </div>



      {showTable && (
        <div className="mt-10 overflow-x-auto min-h-[500px] ">
          <table className="min-w-full bg-white border table-style">
            <thead className="bg-slate-500 text-gray-100 uppercase text-sm">
              <tr>
                <th className="px-4 py-3 text-left">S.No</th>
                <th className="px-4 py-3 text-left">Model Name</th>
                <th className="px-4 py-3 text-left">Date of Receipt</th>
                <th className="px-4 py-3 text-left">Client Name</th>
                <th className="px-4 py-3 text-left">RC Challan No</th>
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
                  <td className="px-4 py-2 ">
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
                      className={`border px-2 py-1 rounded-[4px] w-full cursor-pointer border-gray-300 outline-gray-500 font-[500] ${row.date ? 'text-black' : 'text-gray-500'
                        }`}
                    />
                  </td>

                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Client Name"
                      value={row.clientName}
                      onChange={(e) => handleInputChange(index, 'clientName', e.target.value)}
                      className="border px-2 py-1 cursor-pointer rounded-[4px] w-full border-gray-300 outline-gray-500 placeholder:font-[600] font-[600]"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Challan No"
                      value={row.challan}
                      onChange={(e) => handleInputChange(index, 'challan', e.target.value)}
                      className="border px-2 py-1 cursor-pointer rounded-[4px] w-full border-gray-300 outline-gray-500 placeholder:font-[600] font-[600]"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Total Quantity"
                      value={row.totalQuantity}
                      onChange={(e) => handleInputChange(index, 'totalQuantity', e.target.value)}
                      className="border px-2 py-1 cursor-pointer rounded-[4px] w-full border-gray-300 outline-gray-500 placeholder:font-[600] font-[600]"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Qty Received"
                      value={row.quantityReceived}
                      onChange={(e) => handleInputChange(index, 'quantityReceived', e.target.value)}
                      className="border px-2 py-1 cursor-pointer rounded-[4px] w-full border-gray-300 outline-gray-500 placeholder:font-[600] font-[600]"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      readOnly
                      value={row.quantityLeft || ''}
                      placeholder="Qty Left"
                      className="border px-2 py-1 rounded-[4px] w-full border-gray-300 outline-none placeholder:font-[600] font-[600] cursor-not-allowed"
                    />

                  </td>
                  {/* <td className="px-4 py-2 font-semibold">
                    {row.quantityLeft || ''}
                  </td> */}
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="delete-button button-style duration-300 transition-all cursor-pointer text-white px-4 py-[5px] font-[600] rounded-[4px]  uppercase"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className='flex justify-center mt-2 gap-8 mb-8'>



            <div className="mt-4 text-center">
              <button
                onClick={handleAddRow}
                className="addrow-button button-style text-white px-4 py-2 rounded  transition-all duration-300 cursor-pointer font-[600] uppercase"
              >
                Add Row
              </button>
            </div>

            {productRows.length > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="generate-button button-style text-white px-4 py-2 rounded  transition-all duration-300 cursor-pointer font-[600] uppercase relative w-[140px] h-[42px] overflow-hidden flex items-center justify-center"
                >
                  {/* Text fades out */}
                  <span
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isGenerating ? 'opacity-0' : 'opacity-100'
                      }`}
                  >
                    Generate
                  </span>

                  {/* Spinner fades in */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isGenerating ? 'opacity-100' : 'opacity-0'
                      }`}
                  >
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </button>

              </div>
            )}
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-[8px] shadow-lg w-[450px] text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2 uppercase">Confirm Deletion</h2>
            <p className="text-gray-700 text-sm mb-6">
              Are you sure you want to delete this row? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 cursor-pointer hover:bg-gray-400 px-4 py-2 rounded font-semibold uppercase transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsDeletingRow(true);
                  setTimeout(() => {
                    setProductRows((prev) => prev.filter((row) => row.id !== rowToDelete));
                    setShowDeleteModal(false);
                    setRowToDelete(null);
                    setIsDeletingRow(false);
                  }, 1000); // simulate 1s deletion delay
                }}
                disabled={isDeletingRow}
                className="bg-red-600 cursor-pointer hover:bg-red-700 text-white px-4 py-2 rounded font-semibold uppercase transition-all duration-300 relative w-[110px] h-[40px] overflow-hidden flex items-center justify-center"
              >
                {/* Text fades out */}
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isDeletingRow ? 'opacity-0' : 'opacity-100'
                    }`}
                >
                  Delete
                </span>

                {/* Spinner fades in */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isDeletingRow ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              </button>

            </div>
          </div>
        </div>
      )}


      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-zinc-200 p-6 shadow-lg w-[450px] mx-auto text-center rounded-[8px] min-h-[160px] flex flex-col justify-center items-center">
            <>
              <p className="mb-2 font-[700] text-[20px] uppercase text-red-600">Are you sure you want to logout?</p>
              <p className="text-[16px] text-gray-700 mb-6">
                You will be returned to the login screen and unsaved data will be lost.
              </p>
              <div className="flex justify-end space-x-4 w-full">
                <button
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-[4px] uppercase font-[600] cursor-pointer transition-all duration-300"
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                >
                  Cancel
                </button>
                <button
                  className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-[4px] uppercase font-[600] cursor-pointer transition-all duration-300 relative w-[100px] h-[40px] overflow-hidden`}
                  onClick={() => {
                    setIsLoggingOut(true);
                    setTimeout(() => {
                      sessionStorage.removeItem('invoiceData');
                      setShowLogoutModal(false);
                      setIsLoggingOut(false);
                      navigate('/');
                    }, 1500);
                  }}
                  disabled={isLoggingOut}
                >
                  {/* Logout text fades out */}
                  <span
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 transform ${isLoggingOut ? 'opacity-0 ' : 'opacity-100 '
                      }`}
                  >
                    Logout
                  </span>

                  {/* Spinner slides in with transition */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${isLoggingOut ? ' opacity-100' : ' opacity-0'
                      }`}
                  >
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                </button>
              </div>
            </>
          </div>
        </div>
      )}


      {showVendorAlertModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-zinc-200 px-8 py-6 rounded-[10px] shadow-xl w-[420px] text-center">
            <h2 className="text-[20px] font-bold text-red-700 mb-3 uppercase tracking-wide">
              Vendor Not Selected
            </h2>
            <p className="text-gray-700 text-[15px] mb-3 font-medium">
              You must select a vendor before viewing their invoice history.
            </p>

            <button
              onClick={() => {
                setIsAcknowledgingVendorAlert(true);
                setTimeout(() => {
                  setShowVendorAlertModal(false);
                  setIsAcknowledgingVendorAlert(false);
                }, 700);
              }}
              disabled={isAcknowledgingVendorAlert}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 text-[20px] py-2 rounded-[6px] font-semibold uppercase cursor-pointer transition-all duration-300  items-center justify-center w-[100px] h-[42px] relative overflow-hidden flex justify-self-end"
            >
              {/* Text fades out */}
              <span
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isAcknowledgingVendorAlert ? 'opacity-0' : 'opacity-100'
                  }`}
              >
                OK
              </span>
              {/* Spinner fades in */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isAcknowledgingVendorAlert ? 'opacity-100' : 'opacity-0'
                  }`}
              >
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            </button>
          </div>
        </div>
      )}



      {showVendorChangeModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-[8px] shadow-lg w-[450px] text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2 uppercase">Confirm Vendor Change</h2>
            <p className="text-gray-700 text-sm mb-6">
              Do you want to change vendor? All your unsaved changes will be lost.
            </p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowVendorChangeModal(false)}
                className="bg-gray-300 cursor-pointer hover:bg-gray-400 px-4 py-2 rounded font-semibold uppercase transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsChangingVendor(true);
                  setTimeout(() => {
                    handleVendorClear();
                    setShowVendorChangeModal(false);
                    setIsChangingVendor(false);
                  }, 1200); // simulate delay for UX
                }}
                disabled={isChangingVendor}
                className="bg-red-600 cursor-pointer hover:bg-red-700 text-white px-4 py-2 rounded font-semibold uppercase transition-all duration-300 relative w-[110px] h-[40px] overflow-hidden flex items-center justify-center"
              >
                {/* Text fades out */}
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isChangingVendor ? 'opacity-0' : 'opacity-100'
                    }`}
                >
                  Change
                </span>

                {/* Spinner fades in */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isChangingVendor ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              </button>

            </div>
          </div>
        </div>
      )}


      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 ">
          <div className="bg-zinc-200 p-6 rounded-[10px] shadow-xl w-[450px] text-center">
            <h2 className="text-xl font-bold text-red-700 uppercase mb-2">GO TO JOBSHEET PAGE ?</h2>
            <p className="text-gray-700 text-[15px] mb-6">
              You are about to leave this page. Any unsaved data or changes will be lost.
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="bg-gray-300 cursor-pointer hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold uppercase transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsRedirecting(true); // show spinner
                  setTimeout(() => {
                    setShowConfirmModal(false);
                    goToJobSheetPage();
                  }, 1200); // UX delay
                }}
                disabled={isRedirecting}
                className="bg-green-600 cursor-pointer hover:bg-green-700 text-white px-4 py-2 rounded font-semibold uppercase transition-all duration-300 w-[120px] h-[42px] relative overflow-hidden flex items-center justify-center"
              >
                {/* Button text */}
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isRedirecting ? 'opacity-0' : 'opacity-100'}`}
                >
                  Continue
                </span>

                {/* Spinner */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isRedirecting ? 'opacity-100' : 'opacity-0'}`}
                >
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-zinc-200 rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className='flex justify-center gap-2'>
              <h2 className="text-2xl text-center uppercase font-bold mb-4 text-red-700">⚠️</h2>
              <h2 className="text-2xl text-center uppercase font-bold mb-4 text-red-700 mt-[3px]">Warning</h2>

            </div>
            <p className="text-gray-800">{errorModalMessage}</p>
            <div className="mt-6 text-right">
              <button
                onClick={() => {
                  setIsClosingModal(true);
                  setTimeout(() => {
                    setShowErrorModal(false);
                    setIsClosingModal(false);
                  }, 700); // match delay with vendor change UX
                }}
                disabled={isClosingModal}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold uppercase transition-all duration-300 relative w-[110px] h-[40px] overflow-hidden flex items-center justify-self-end cursor-pointer"
              >
                {/* Text fades out */}
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isClosingModal ? 'opacity-0' : 'opacity-100'
                    }`}
                >
                  Close
                </span>

                {/* Spinner fades in */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isClosingModal ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              </button>

            </div>
          </div>
        </div>
      )}




    </div>
  );
};

export default InvoicePage;
