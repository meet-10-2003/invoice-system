import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const fetchFromSheet = async () => {
    const response = await fetch(
        "https://opensheet.elk.sh/1aHdnjnvQG_S5uVbUWhKJNLz8Ea2GtSteBPWLyijO-6Y/Sheet1"
    );
    const data = await response.json();
    return data.map(item => ({
        vendor: item.vendor?.trim(),
        name: item.name?.trim(),
        description: item.description?.trim(),
        image: item.image?.trim(),
        price: parseFloat(item.price) || 0
    }));
};

const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const date = new Date(inputDate);
    return isNaN(date) ? inputDate : date.toLocaleDateString('en-IN');
};

const GeneratePI = () => {
    const { orderNo } = useParams();
    const [orderRows, setOrderRows] = useState([]);
    const [clientName, setClientName] = useState('');
    const [sheetDate, setSheetDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [vendorSuggestions, setVendorSuggestions] = useState([]);
    const [showPISection, setShowPISection] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVendorRows, setSelectedVendorRows] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(
                    'https://script.google.com/macros/s/AKfycbzxeM1gL6Ue-fdi3xvrPaW1Ky2YBukfY2Tg6EhCGQSkErGp7J88w4I2n6xhDPKCY9RX/exec'
                );
                const data = await res.json();

                const filtered = data.filter(row =>
                    String(row['Order No'] || '').trim() === String(orderNo).trim()
                );
                setOrderRows(filtered);

                const firstRow = filtered.find(row => row['Client Name']);
                setClientName(firstRow?.['Client Name']?.trim() || '');
                setSheetDate(firstRow?.['Date']?.trim() || '');

                const vendorMeta = await fetchFromSheet();
                setVendorSuggestions(vendorMeta);
            } catch (err) {
                console.error('❌ Error fetching order data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [orderNo]);

    const fetchVendorRows = async (vendorName) => {
        try {
            const res = await fetch(
                'https://script.google.com/macros/s/AKfycbzxeM1gL6Ue-fdi3xvrPaW1Ky2YBukfY2Tg6EhCGQSkErGp7J88w4I2n6xhDPKCY9RX/exec'
            );
            const data = await res.json();

            const trimmedOrderNo = String(orderNo).trim().toLowerCase();
            const trimmedClient = clientName.trim().toLowerCase();
            const trimmedVendor = vendorName.trim().toLowerCase();
            const formattedSheetDate = new Date(sheetDate).toLocaleDateString('en-IN');

            const filtered = data.filter(row => {
                const orderMatch = String(row['Order No'] || '').trim().toLowerCase() === trimmedOrderNo;
                const selectedMatch = ['true', '1', 'yes', 'selected'].includes(String(row['Selected']).toLowerCase().trim());
                const vendorMatch = String(row['Vendor'] || '').trim().toLowerCase() === trimmedVendor;
                const clientMatch = String(row['Client Name'] || '').trim().toLowerCase() === trimmedClient;
                const dateMatch = new Date(row['Date']).toLocaleDateString('en-IN') === formattedSheetDate;

                const isMatch = orderMatch && selectedMatch && vendorMatch && clientMatch && dateMatch;

                if (!isMatch) {
                    console.log('❌ Skipped row due to mismatch:', {
                        order: row['Order No'],
                        vendor: row['Vendor'],
                        client: row['Client Name'],
                        selected: row['Selected'],
                        date: row['Date'],
                        reason: {
                            orderMatch,
                            selectedMatch,
                            vendorMatch,
                            clientMatch,
                            dateMatch
                        }
                    });
                }

                return isMatch;
            });

            const processed = filtered.map((row, i) => ({
                sno: i + 1,
                model: row['Model'],
                qtyOrdered: Number(row['Quantity']) || 1,
                price: row['Price'] || 0
            }));

            console.log('✅ Selected vendor rows:', processed);
            setSelectedVendorRows(processed);
        } catch (err) {
            console.error('❌ Error fetching vendor rows:', err);
            setSelectedVendorRows([]);
        }
    };


    const handleSearchClick = () => {
        if (searchTerm.trim()) fetchVendorRows(searchTerm.trim());
    };

    const handleSuggestionClick = (vendorName) => {
        setSearchTerm(vendorName);
        fetchVendorRows(vendorName);
    };

    const uniqueVendorSuggestions = Array.from(
        new Map(vendorSuggestions.map(v => [v.vendor?.toLowerCase(), v])).values()
    );

    const filteredSuggestions = uniqueVendorSuggestions.filter(v =>
        v.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-white min-h-screen">
            <h1 className="text-2xl font-bold text-center mb-6">Generate PI - Order No: {orderNo}</h1>

            {loading ? (
                <p className="text-center text-gray-500">Loading...</p>
            ) : orderRows.length === 0 ? (
                <p className="text-center text-gray-500">No rows found for this Order No.</p>
            ) : (
                <>
                    <div className="mb-10">
                        <h2 className="text-xl font-semibold mb-2">Fetched Rows:</h2>
                        <table className="min-w-full border border-gray-300 text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border px-2 py-1">S.No</th>
                                    <th className="border px-2 py-1">Model</th>
                                    <th className="border px-2 py-1">Vendor</th>
                                    <th className="border px-2 py-1">Qty</th>
                                    <th className="border px-2 py-1">Price</th>
                                    <th className="border px-2 py-1">Selected</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderRows.map((row, i) => (
                                    <tr key={i} className="text-center">
                                        <td className="border px-2 py-1">{i + 1}</td>
                                        <td className="border px-2 py-1">{row['Model']}</td>
                                        <td className="border px-2 py-1">{row['Vendor']}</td>
                                        <td className="border px-2 py-1">{row['Quantity']}</td>
                                        <td className="border px-2 py-1">₹{row['Price']}</td>
                                        <td className="border px-2 py-1 text-red-600">{row['Selected']}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {!showPISection && (
                        <div className="text-center mb-6">
                            <button
                                onClick={() => setShowPISection(true)}
                                className="bg-green-600 text-white px-6 py-2 rounded shadow"
                            >
                                Generate PI
                            </button>
                        </div>
                    )}

                    {showPISection && (
                        <div className="mb-10 relative">
                            <h2 className="text-xl font-semibold mb-2">Search Selected Vendor</h2>
                            <div className="flex gap-2 mb-1">
                                <input
                                    type="text"
                                    placeholder="Search vendor from selected rows..."
                                    className="w-full border p-2 rounded"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button
                                    className="bg-blue-500 text-white px-4 py-2 rounded"
                                    onClick={handleSearchClick}
                                >
                                    Search
                                </button>
                            </div>

                            {searchTerm && filteredSuggestions.length > 0 && (
                                <ul className="absolute bg-white border w-full z-10 max-h-40 overflow-y-auto shadow-md rounded">
                                    {filteredSuggestions.map((vendor, i) => (
                                        <li
                                            key={i}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => handleSuggestionClick(vendor.vendor)}
                                        >
                                            {vendor.vendor}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="mt-6 border rounded-lg p-4 shadow">
                                {selectedVendorRows.length === 0 ? (
                                    <p className="text-center text-gray-500">
                                        No vendor selected yet or no matching rows.
                                    </p>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-bold mb-2">Vendor: {searchTerm}</h3>
                                        <p className="mb-1">Client Name: {clientName}</p>
                                        <p className="mb-1">Order No: {orderNo}</p>
                                        <p className="mb-4">Date: {formatDate(sheetDate)}</p>

                                        <table className="min-w-full border border-gray-300 text-sm mt-2">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="border px-4 py-2">S.No</th>
                                                    <th className="border px-4 py-2">Model</th>
                                                    <th className="border px-4 py-2">Qty Ordered</th>
                                                    <th className="border px-4 py-2">Price/Qty</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedVendorRows.map((item, idx) => (
                                                    <tr key={idx} className="text-center">
                                                        <td className="border px-4 py-2">{item.sno}</td>
                                                        <td className="border px-4 py-2">{item.model}</td>
                                                        <td className="border px-4 py-2">{item.qtyOrdered}</td>
                                                        <td className="border px-4 py-2">₹{item.price}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GeneratePI;
