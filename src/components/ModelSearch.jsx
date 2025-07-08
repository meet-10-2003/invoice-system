import React, { useState, useEffect, useRef } from 'react';
import fetchFromSheet from './utils/fetchFromSheet';

const ModelSearch = ({ vendor, onSelect, value = '', selectedModels = [] }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [query, setQuery] = useState(value);
  const [filteredModels, setFilteredModels] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const itemRefs = useRef([]);

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
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredModels.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredModels[selectedIndex]) {
        handleSelect(filteredModels[selectedIndex]);
      }
    }
  };

  // Scroll the selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, filteredModels.length);
  }, [filteredModels]);

  return (
    <div className="relative ">
      <input
        type="text"
        placeholder="Search Model"
        className="border cursor-pointer px-2 py-1 rounded w-full uppercase placeholder:capitalize placeholder:font-[600] font-[600] border-gray-300 outline-gray-500"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />

      {showSuggestions && query && filteredModels.length > 0 && (
        <ul className="absolute model-search-main top-[100%] left-0 z-[10] border w-full mt-1 shadow rounded overflow-y-auto h-40">
          {filteredModels.map((model, index) => (
            <li
              key={index}
              ref={(el) => (itemRefs.current[index] = el)}
              className={`flex justify-between items-center model-search text-[11px] px-2 py-2 cursor-pointer font-[600] uppercase transition-all duration-300 ${
                selectedIndex === index ? 'model-search-key text-white ml-[2px]' : ''
              }`}
              onMouseDown={() => handleSelect(model)}
            >
              <span className="flex-1">{model.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ModelSearch;
