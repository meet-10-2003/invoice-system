// JobSheetEdit.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const JobSheetEdit = () => {
    const { orderNo } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [clientName, setClientName] = useState('');
    const [date, setDate] = useState('');

    const formatDate = (input) => {
        const date = new Date(input);
        if (isNaN(date)) return input;

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };


    useEffect(() => {
        fetch('https://script.google.com/macros/s/AKfycbyR2qtnXxKJ1lHCRnfAnQA6hb4NRaas-EWbrBXUa9lBHsuHFUej0SePVIPgojlja_5M/exec')
            .then((res) => res.json())
            .then((data) => {
                const filtered = data.filter(row => row['Order No'] === orderNo);
                if (filtered.length > 0) {
                    const rawDate = filtered[0]['Date'];
                    const formatted = formatDate(rawDate); // 👈 use formatter
                    setDate(formatted);
                    setClientName(filtered[0]['Client Name']);
                    setProducts(
                        filtered.map(p => ({
                            ...p,
                            Selected: p.Selected === 'true' || p.Selected === true,
                        }))
                    );
                }
            });
    }, [orderNo]);


    const handleToggle = (index) => {
        // ✅ Just toggle checkbox state — don't delete here
        setProducts(prev =>
            prev.map((item, i) =>
                i === index ? { ...item, Selected: !item.Selected } : item
            )
        );
    };



    const handleSave = async () => {
        // Step 1: DELETE all rows for this Order No
        for (const item of products) {
            const deletePayload = {
                orderNumber: orderNo,
                vendor: item["Vendor"],
                model: item["Model"],
                action: "delete"
            };

            await fetch('http://localhost:3001/delete-job-sheet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deletePayload),
            });
        }

        // Step 2: Save only selected rows
        const selected = products.filter(p => p.Selected);

        if (selected.length > 0) {
            const savePayload = {
                rows: selected.map(p => ({
                    date,
                    orderNumber: orderNo,
                    clientName,
                    model: p["Model"],
                    vendor: p["Vendor"],
                    description: p["Description"],
                    price: p["Price"],
                    image: p["Image"],
                    quantity: p["Quantity"],
                    selected: true
                }))
            };

            const saveRes = await fetch('http://localhost:3001/save-job-sheet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(savePayload),
            });

            const saveResult = await saveRes.json();
            console.log("📥 Save result:", saveResult);
        }

        alert('✅ Job sheet updated successfully!');
        navigate('/job-history');
    };













    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Editing Job Sheet: {orderNo}</h2>
            <p className="mb-2"><strong>Date:</strong> {date}</p>
            <p className="mb-4"><strong>Client:</strong> {clientName}</p>

            <table className="min-w-full border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border px-4 py-2">Model</th>
                        <th className="border px-4 py-2">Vendor</th>
                        <th className="border px-4 py-2">Description</th>
                        <th className="border px-4 py-2">Qty</th>
                        <th className="border px-4 py-2">Price</th>
                        <th className="border px-4 py-2">Selected</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((item, index) => (
                        <tr key={index} className="text-center">
                            <td className="border px-4 py-2">{item["Model"]}</td>
                            <td className="border px-4 py-2">{item["Vendor"]}</td>
                            <td className="border px-4 py-2">{item["Description"]}</td>
                            <td className="border px-4 py-2">{item["Quantity"]}</td>
                            <td className="border px-4 py-2">₹{item["Price"]}</td>
                            <td className="border px-4 py-2">
                                <input
                                    type="checkbox"
                                    checked={item.Selected}
                                    onChange={() => handleToggle(index)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button
                onClick={handleSave}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
                Save Changes
            </button>
        </div>
    );
};


export default JobSheetEdit;  