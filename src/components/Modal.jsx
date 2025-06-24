
// import React from 'react';

const modal = ({ title, message1, message2, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 bg-opacity-50 z-50 ">
      <div className="bg-white px-6 py-6 shadow-lg w-[450px] rounded-2xl relative">
        <div className='absolute top-4 right-6 z-50'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onClick={onClose} className='w-6 h-6 font-bold cursor-pointer' fill="currentColor"><path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path></svg>
        </div>
        <h2 className="text-xl mb-2 tracking-tight font-bold uppercase">{title}</h2>
        <p className="font-[600] text-gray-600 tracking-tight">{message1}</p>
        <p className="mb-4 font-[600] text-gray-600 tracking-tight">{message2}</p>
        <button 
          onClick={onClose}
          className="w-full text-white flex justify-end"
        >
            <span className='bg-red-500 px-6 py-2 rounded-xl hover:bg-red-600 transition-all duration-300 cursor-pointer font-[600] tracking-tight'>Close</span>
          
        </button>
      </div>
    </div>
  );
};

export default modal;
