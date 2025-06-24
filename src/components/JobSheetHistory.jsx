import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JobSheetHistory = () => {
    const [sortedOrders, setSortedOrders] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('https://script.google.com/macros/s/AKfycbyR2qtnXxKJ1lHCRnfAnQA6hb4NRaas-EWbrBXUa9lBHsuHFUej0SePVIPgojlja_5M/exec')
            .then((res) => res.json())
            .then((data) => {
                const grouped = {};

                data.forEach((item, index) => {
                    const orderNo = item['Order No'];
                    if (!grouped[orderNo]) {
                        grouped[orderNo] = {
                            orderNo,
                            date: item['Date'],
                            formattedDate: formatDate(item['Date']),
                            clientName: item['Client Name'],
                            products: [],
                            rowIndex: index, // capture order from sheet
                        };
                    }
                    grouped[orderNo].products.push(item);
                });

                // Convert to array and sort by date DESC, then rowIndex DESC
                const groupedArray = Object.values(grouped).sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    if (dateA.getTime() === dateB.getTime()) {
                        return b.rowIndex - a.rowIndex; // show newer rows first
                    }
                    return dateB - dateA;
                });

                setSortedOrders(groupedArray);
            })
            .catch((err) => console.error('Fetch failed:', err));
    }, []);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        if (isNaN(date)) return dateStr;
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="p-6 bg-white min-h-screen">
            <h2 className="text-2xl font-bold mb-6 text-center">Job Sheet History</h2>

            {sortedOrders.length === 0 ? (
                <p className="text-center text-gray-500">No job sheets found.</p>
            ) : (
                <div className="space-y-8">
                    {sortedOrders.map(({ orderNo, formattedDate, clientName, products }) => (
                        <div key={orderNo} className="border rounded-lg p-6 shadow-md">
                            <div className="mb-4">
                                <p><strong>Order No:</strong> {orderNo}</p>
                                <p><strong>Date:</strong> {formattedDate}</p>
                                <p><strong>Client Name:</strong> {clientName}</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full border border-gray-300 text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border px-4 py-2">S.No</th>
                                            <th className="border px-4 py-2">Model</th>
                                            <th className="border px-4 py-2">Vendor</th>
                                            <th className="border px-4 py-2">Image</th>
                                            <th className="border px-4 py-2">Description</th>
                                            <th className="border px-4 py-2">Qty</th>
                                            <th className="border px-4 py-2">Price</th>
                                            <th className="border px-4 py-2">Selected</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((item, index) => (
                                            <tr key={index} className="text-center">
                                                <td className="border px-4 py-2">{index + 1}</td>
                                                <td className="border px-4 py-2">{item["Model"]}</td>
                                                <td className="border px-4 py-2">{item["Vendor"]}</td>
                                                <td className="border px-4 py-2">
                                                    {item["Image"] ? (
                                                        <img src={item["Image"]} alt="Model" className="w-16 h-16 mx-auto object-contain" />
                                                    ) : (
                                                        "N/A"
                                                    )}
                                                </td>
                                                <td className="border px-4 py-2">{item["Description"]}</td>
                                                <td className="border px-4 py-2">{item["Quantity"]}</td>
                                                <td className="border px-4 py-2">₹{item["Price"]}</td>
                                                <td className="border px-4 py-2">{item["Selected"]}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 flex justify-end space-x-4">
                                <button
                                    onClick={() => navigate(`/job-sheet/edit/${orderNo}`)}
                                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                                >
                                    Edit Order
                                </button>
                                <button
                                    onClick={() => navigate(`/generate-pi/${orderNo}`)}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                >
                                    Generate PI
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JobSheetHistory;
