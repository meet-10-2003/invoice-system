import React, { useState, useEffect, useRef } from 'react';
import fetchFromSheet from './utils/fetchFromSheet';

const SearchBar = ({ onVendorSelect }) => {
    const [products, setProducts] = useState([]);
    const [vendorInput, setVendorInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const inputRef = useRef(null);

    useEffect(() => {
        fetchFromSheet().then(setProducts);
    }, []);

    const allVendors = Array.from(new Set(products.map(p => p.vendor)));

    const handleInputChange = (e) => {
        const input = e.target.value;
        setVendorInput(input);

        if (input.trim() === '') {
            setSuggestions([]);
        } else {
            const filtered = allVendors.filter(v =>
                v.toLowerCase().includes(input.toLowerCase())
            );
            setSuggestions(filtered);
        }

        setHighlightIndex(-1);
    };

    const handleSelect = (vendor) => {
        setVendorInput(vendor);
        setSuggestions([]);
        setHighlightIndex(-1);
        inputRef.current.blur();
        setTimeout(() => inputRef.current.focus(), 0);
    };

const handleSearch = () => {
    if (vendorInput.trim() === '') {
        alert('Please enter a vendor name before searching.');
        return;
    }

    const matchedVendor = allVendors.find(
        v => v.toLowerCase() === vendorInput.trim().toLowerCase()
    );

    if (matchedVendor) {
        onVendorSelect(matchedVendor);
        setSuggestions([]);
    } else {
        alert('Vendor not found. Please check the spelling or try again.');
    }
};


    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
                handleSelect(suggestions[highlightIndex]);
                setSuggestions([]); // ✅ Hide after keyboard select
            } else {
                handleSearch(); // ✅ Also allow Enter to trigger search directly
            }
        }
    };

    return (
        <div className="relative w-full max-w-md mx-auto">
            <div className="flex items-center gap-2 border px-4 py-2 rounded-full bg-white shadow">
                <input
                    type="text"
                    placeholder="Search Vendor Name"
                    value={vendorInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    ref={inputRef}
                    className="flex-1 outline-none bg-transparent font-semibold tracking-tight"
                />
                <button
                    onClick={handleSearch}
                    className="text-sm bg-blue-600 text-white px-4 py-1 rounded-full hover:bg-blue-700 transition"
                >
                    Search
                </button>
            </div>

            {suggestions.length > 0 && (
                <ul className="absolute w-full bg-white border rounded mt-1 max-h-48 overflow-y-auto shadow-md z-10">
                    {suggestions.map((vendor, index) => (
                        <li
                            key={vendor}
                            className={`px-4 py-2 cursor-pointer ${index === highlightIndex ? 'bg-blue-100' : ''
                                }`}
                            onMouseDown={() => handleSelect(vendor)}
                        >
                            {vendor}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchBar;
