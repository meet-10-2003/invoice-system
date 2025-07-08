import React, { useState, useEffect, useRef } from 'react';
import fetchFromSheet from './utils/fetchFromSheet';

const SearchBar = ({ onVendorSelect }) => {
    const [products, setProducts] = useState([]);
    const [vendorInput, setVendorInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [isClosingAlert, setIsClosingAlert] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const inputRef = useRef(null);
    const suggestionRefs = useRef([]);

    useEffect(() => {
        fetchFromSheet().then(setProducts);
    }, []);

    const allVendors = Array.from(
        new Set(
            products
                .map(p => p.vendor?.trim())
                .filter(v => typeof v === 'string' && v.length >= 3)
        )
    ).sort();

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

    const handleCloseAlert = () => {
        setIsClosingAlert(true);
        setTimeout(() => {
            setIsClosingAlert(false);
            setShowAlertModal(false);
        }, 700);
    };

    const handleSearch = () => {
        if (vendorInput.trim() === '') {
            setShowAlertModal(true);
            return;
        }

        setIsSearching(true);

        setTimeout(() => {
            const matchedVendor = allVendors.find(
                v => v.toLowerCase() === vendorInput.trim().toLowerCase()
            );

            if (matchedVendor) {
                onVendorSelect(matchedVendor);
                setSuggestions([]);
            } else {
                setShowAlertModal(true);
            }

            setIsSearching(false);
        }, 1000);
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
            } else {
                handleSearch();
            }
        }
    };

    // Keep refs synced with suggestions
    useEffect(() => {
        suggestionRefs.current = suggestionRefs.current.slice(0, suggestions.length);
    }, [suggestions]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightIndex >= 0 && suggestionRefs.current[highlightIndex]) {
            suggestionRefs.current[highlightIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [highlightIndex]);

    return (
        <div className="relative w-full max-w-2xl mx-auto mt-4 ">
            {/* <div className="flex items-center gap-2 border-2 pl-4 rounded-[8px] bg-white shadow max-w-xl mx-auto">
                <input
                    type="text"
                    placeholder="SEARCH VENDOR NAME"
                    value={vendorInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    ref={inputRef}
                    className="outline-none  bg-transparent font-semibold tracking-tight flex-1 placeholder:text-[16px] placeholder:tracking-normal"
                />
                <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="text-[16px] search-button uppercase text-white px-10 py-2 font-semibold rounded-tr-[6px] rounded-br-[6px] transition-all duration-300 cursor-pointer relative w-[120px] h-[40px] overflow-hidden flex items-center justify-center"
                >
                    <span className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isSearching ? 'opacity-0' : 'opacity-100'}`}>
                        Search
                    </span>
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isSearching ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                </button>
            </div> */}


            <div className="flex items-center gap-0 border-2 border-black rounded-[8px] bg-white button-style max-w-xl mx-auto overflow-hidden">
                <input
                    type="text"
                    placeholder="SEARCH VENDOR NAME"
                    value={vendorInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    ref={inputRef}
                    className="outline-none bg-transparent font-semibold tracking-tight px-4 py-2 flex-1 placeholder:text-[16px] placeholder:tracking-normal"
                />
                <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="text-[16px] cursor-pointer uppercase text-white px-6 py-[20px] font-semibold bg-red-600 hover:bg-red-700 transition duration-300 w-[120px] h-full relative flex items-center justify-center"
                >
                    <span
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isSearching ? 'opacity-0' : 'opacity-100'}`}
                    >
                        Search
                    </span>
                    <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isSearching ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                </button>
            </div>


            {suggestions.length > 0 && (
                <ul className="absolute left-12 w-[576px] button-style bg-zinc-100 border rounded mt-1 max-h-48 overflow-y-auto shadow-md z-10 ">
                    {suggestions.map((vendor, index) => (
                        <li
                            key={vendor}
                            ref={el => (suggestionRefs.current[index] = el)}
                            className={` px-4 font-[500] py-2 cursor-pointer transition-all duration-300 ${index === highlightIndex ? 'bg-[#ff0000] text-white ml-[2px]' : 'model-search'
                                }`}
                            onMouseDown={() => handleSelect(vendor)}
                        >
                            {vendor}
                        </li>
                    ))}
                </ul>
            )}

            {showAlertModal && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                    <div className="bg-zinc-200 px-8 py-6 rounded-[10px] shadow-2xl w-[500px] text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-3 uppercase tracking-wide">SEARCH ERROR</h2>
                        <p className="text-gray-600 text-[15px] mb-3">
                            Please enter a vendor name before searching. Kindly correct the input and try again.
                        </p>
                        <button
                            onClick={handleCloseAlert}
                            disabled={isClosingAlert}
                            className="bg-red-600 hover:bg-red-700 flex justify-self-end items-center cursor-pointer text-white text-[18px] px-8 py-3 rounded-[6px] font-semibold uppercase tracking-wide transition-all duration-300 w-[120px] h-[48px] relative overflow-hidden"
                        >
                            <span className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isClosingAlert ? 'opacity-0' : 'opacity-100'}`}>
                                OK
                            </span>
                            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isClosingAlert ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
