import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchFromSheet from './utils/fetchFromSheet';
import saveJobSheetToSheet from './utils/saveJobSheet';

const JobSheetPage = () => {
    const [date, setDate] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [clientName, setClientName] = useState('');
    const [allModels, setAllModels] = useState([]);
    const [searchRows, setSearchRows] = useState([]);
    const [hasSaved, setHasSaved] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
        fetchFromSheet().then((data) => setAllModels(data));
    }, []);

    const goToInvoicePage = async () => {
        try {
            await fetch('http://localhost:3001/notify-transition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page: 'invoice' }),
            });
        } catch (error) {
            console.error('Failed to notify backend:', error);
        }
        navigate('/invoice');
    };

    const addProductRow = () => {
        const newRow = {
            id: Date.now(),
            searchText: '',
            suggestions: [],
            filteredResults: [],
            quantity: '',
        };
        setSearchRows((prev) => [newRow, ...prev]);
    };

    const handleDeleteRow = (id) => {
        setSearchRows((prev) => prev.filter((row) => row.id !== id));
    };

    const handleSearchChange = (index, value) => {
        const updated = [...searchRows];
        updated[index].searchText = value;

        if (value.trim() === '') {
            updated[index].suggestions = [];
        } else {
            const suggestions = [
                ...new Set(
                    allModels
                        .filter((item) =>
                            item.name?.toLowerCase().includes(value.toLowerCase())
                        )
                        .map((item) => item.name.trim())
                ),
            ];
            updated[index].suggestions = suggestions;
        }

        setSearchRows(updated);
    };

    const handleSuggestionClick = (index, modelName) => {
        const updated = [...searchRows];
        updated[index].searchText = modelName;
        updated[index].suggestions = [];

        const matches = allModels
            .filter((item) => item.name?.toLowerCase() === modelName.toLowerCase())
            .map((item) => ({ ...item, selected: false }));

        updated[index].filteredResults = matches;
        setSearchRows(updated);
    };

    const handleCheckboxChange = (rowIndex, itemIndex) => {
        const updated = [...searchRows];
        updated[rowIndex].filteredResults[itemIndex].selected =
            !updated[rowIndex].filteredResults[itemIndex].selected;
        setSearchRows(updated);
    };

    const handleQtyChange = (index, value) => {
        const updated = [...searchRows];
        updated[index].quantity = value;
        setSearchRows(updated);
    };

    const handleSave = async () => {
        if (!clientName.trim()) return alert('Client Name is required.');
        if (!orderNumber.trim()) return alert('Order Number is required.');

        for (let i = 0; i < searchRows.length; i++) {
            const row = searchRows[i];
            if (!row.quantity || parseInt(row.quantity) <= 0) {
                alert(`Quantity is required for row ${i + 1}`);
                return;
            }
            if (row.filteredResults.length === 0) {
                alert(`Please select a model for row ${i + 1}`);
                return;
            }
            if (row.filteredResults.some((item) => item.selected)) {
                alert(`Checkboxes should not be selected in row ${i + 1}`);
                return;
            }
        }

        const detailedRows = searchRows.flatMap((row) =>
            row.filteredResults.map((item) => ({
                date,
                orderNumber,
                clientName,
                model: item.name,
                vendor: item.vendor,
                description: item.description,
                price: item.price,
                image: item.image,
                quantity: row.quantity,
                selected: item.selected || false,
            }))
        );

        try {
            const uniqueVendors = [...new Set(detailedRows.map((r) => r.vendor))];

            // 🏃‍♂️ Run all deletions in parallel
            await Promise.all(
                uniqueVendors.map((vendor) =>
                    fetch('http://localhost:3001/delete-job-sheet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderNumber, vendor }),
                    })
                )
            );

            // ✅ Now save
            const result = await saveJobSheetToSheet({ rows: detailedRows });

            if (result.success) {
                alert('Job Sheet Saved Successfully (Overwritten if existing)');
                setHasSaved(true);
            } else {
                alert('Save failed. Try again.');
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('Something went wrong while saving.');
        }
    };


    return (
        <div className="p-6 bg-white min-h-screen">
            <h2 className="text-2xl font-bold mb-6 text-center">Job Sheet</h2>

            <div className="mb-6">
                <button
                    onClick={goToInvoicePage}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-2"
                >
                    Go to Invoice Page
                </button>

                <button
                    onClick={() => navigate('/job-history')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 mr-2"
                >
                    View Orders
                </button>
            </div>

            <div className="space-y-4 max-w-md">
                <div>
                    <label className="block font-semibold text-gray-700">Date</label>
                    <input
                        type="date"
                        value={date}
                        readOnly
                        className="w-full border rounded px-3 py-2 bg-gray-100"
                    />
                </div>
                <div>
                    <label className="block font-semibold text-gray-700">Order Number</label>
                    <input
                        type="text"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Enter Order Number"
                    />
                </div>
                <div>
                    <label className="block font-semibold text-gray-700">Client Name</label>
                    <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Enter Client Name"
                    />
                </div>
            </div>

            <div className="mt-6 mb-4">
                <button
                    onClick={addProductRow}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Add Product
                </button>
            </div>

            {searchRows.map((row, rowIndex) => (
                <div key={row.id} className="mb-8">
                    <div className="mb-2 flex gap-4 items-center">
                        <div className="w-[300px]">
                            <label className="block font-semibold text-gray-700">Search Model</label>
                            <input
                                type="text"
                                value={row.searchText}
                                onChange={(e) => handleSearchChange(rowIndex, e.target.value)}
                                placeholder="Type model name..."
                                className="w-full border rounded px-3 py-2"
                            />
                            {row.suggestions.length > 0 && (
                                <ul className="border rounded mt-1 bg-white shadow max-h-40 overflow-y-auto">
                                    {row.suggestions.map((sug, i) => (
                                        <li
                                            key={i}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => handleSuggestionClick(rowIndex, sug)}
                                        >
                                            {sug}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700">Qty Ordered</label>
                            <input
                                type="number"
                                min="1"
                                value={row.quantity}
                                onChange={(e) => handleQtyChange(rowIndex, e.target.value)}
                                placeholder="Qty"
                                className="w-48 border rounded px-3 py-2"
                            />
                        </div>

                        <div className="mt-5">
                            <button
                                onClick={() => handleDeleteRow(row.id)}
                                className="text-white bg-red-500 hover:bg-red-700 font-semibold px-4 py-2 rounded"
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    {row.filteredResults.length > 0 && (
                        <div className="overflow-x-auto mt-4">
                            <table className="min-w-full border border-gray-300 text-sm">
                                <thead className="bg-gray-200 text-gray-700">
                                    <tr>
                                        <th className="border px-4 py-2">S.No</th>
                                        <th className="border px-4 py-2">Model</th>
                                        <th className="border px-4 py-2">Vendor</th>
                                        <th className="border px-4 py-2">Image</th>
                                        <th className="border px-4 py-2">Description</th>
                                        <th className="border px-4 py-2">Price</th>
                                        <th className="border px-4 py-2">Select</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {row.filteredResults.map((item, itemIndex) => (
                                        <tr key={itemIndex} className="text-center">
                                            <td className="border px-4 py-2">{itemIndex + 1}</td>
                                            <td className="border px-4 py-2">{item.name}</td>
                                            <td className="border px-4 py-2">{item.vendor}</td>
                                            <td className="border px-4 py-2">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-16 h-16 object-contain mx-auto"
                                                    />
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td className="border px-4 py-2">{item.description}</td>
                                            <td className="border px-4 py-2">₹{item.price}</td>
                                            <td className="border px-4 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={item.selected || false}
                                                    onChange={() => handleCheckboxChange(rowIndex, itemIndex)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ))}

            <div className="mt-8">
                <button
                    onClick={handleSave}
                    className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
                >
                    {hasSaved ? 'Save Again' : 'Save'}
                </button>
            </div>

            {/* ✅ New Google Sheet Button */}
            <div className="mt-4">
                <button
                    onClick={() =>
                        window.open(
                            'https://script.google.com/macros/s/AKfycbzljEJwOQCPVo0JRM7Unw32UvUgfW3PHlF7pN3ZalapT_4d31veVpg4-MYIjppGDzxY/exec',
                            '_blank'
                        )
                    }
                    className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600"
                >
                    Open Google Sheet
                </button>
            </div>
        </div>
    );
};

export default JobSheetPage;
