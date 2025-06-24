import React, { useState, useEffect } from 'react';
import fetchFromSheet from './utils/fetchFromSheet';

const ModelSearch = ({ vendor, onSelect, value = '', selectedModels = [] }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [query, setQuery] = useState(value);
  const [filteredModels, setFilteredModels] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchFromSheet();
      setAllProducts(data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

const handleInputChange = (e) => {
  const input = e.target.value;
  setQuery(input);
  setShowSuggestions(true);
  setSelectedIndex(-1);

  const normalize = (str) => str.toLowerCase().replace(/[\s_-]+/g, '');

  const filtered = allProducts.filter(
    (item) =>
      normalize(item.vendor) === normalize(vendor) &&
      item.name.toLowerCase().includes(input.toLowerCase())
  );
  setFilteredModels(filtered);
};


  const handleSelect = (model) => {
    setQuery(model.name);
    setShowSuggestions(false);
    onSelect(model);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex((prev) => Math.min(prev + 1, filteredModels.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && filteredModels[selectedIndex]) {
        handleSelect(filteredModels[selectedIndex]);
      }
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search Model"
        className="border px-2 py-1 rounded w-full"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      {showSuggestions && query && filteredModels.length > 0 && (
        <ul className="absolute top-[100%] left-0 z-[999] bg-white border w-full h-auto mt-1 shadow rounded">
          {filteredModels.map((model, index) => (
            <li
              key={index}
              className={`flex justify-between items-center px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                selectedIndex === index ? 'bg-blue-100' : ''
              }`}
            >
              <span
                className="flex-1"
                onClick={() => handleSelect(model)}
              >
                {model.name}
              </span>
              <button
                className="ml-2 text-blue-600 hover:underline text-sm"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(model);
                }}
              >
                Select
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ModelSearch;
