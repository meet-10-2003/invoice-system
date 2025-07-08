import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FrontPage = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [displayedText, setDisplayedText] = useState('');

    const fullText = 'WELCOME TO METAL AVENUES SOFTWARE';

    const handleClick = () => {
        setIsOpen(true);
        setTimeout(() => {
            setIsLoading(true); // Show welcome + spinner
        }, 1200); // After doors open
    };

    useEffect(() => {
        if (!isLoading) return;

        let i = 0;
        let currentText = '';

        const interval = setInterval(() => {
            currentText += fullText.charAt(i);
            setDisplayedText(currentText);
            i++;

            if (i === fullText.length) {
                clearInterval(interval);
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            }
        }, 150);

        return () => clearInterval(interval);
    }, [isLoading]);






    useEffect(() => {
        if (!isLoading) return;

        if (displayedText.length === fullText.length) {
            const timer = setTimeout(() => {
                navigate('/login');
            }, 1300);
            return () => clearTimeout(timer);
        }
    }, [displayedText, isLoading, navigate]);



    return (
        <div className="relative w-screen h-screen bg-gradient-to-br from-gray-800 via-slate-700 to-black overflow-hidden flex items-center justify-center">
            {/* Left Door */}
            <div
                className={`absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-red-950 to-red-500 border-r border-gray-500 transition-transform duration-[1200ms] ease-in-out ${isOpen ? '-translate-x-full' : 'translate-x-0'
                    }`}
            />

            {/* Right Door */}
            <div
                className={`absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-slate-700 to-gray-300 border-l border-gray-800 transition-transform duration-[1200ms] ease-in-out ${isOpen ? 'translate-x-full' : 'translate-x-0'
                    }`}
            />

            {/* Loading screen after door opens */}
            {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-slate-700 to-black flex flex-col items-center justify-center z-20">
                    <h1 className="text-white text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                        {displayedText}
                    </h1>
                    <div className="w-12 h-12 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                </div>
            )}

            {/* Center Content */}
            {!isOpen && !isLoading && (
                <div className="z-10 text-center select-none">
                    <h1 className="text-[52px] font-bold tracking-wide flex justify-center gap-2 heading text-style-2">
                        <span
                            className="animate-heartbeat text-flash transform transition-transform duration-500 text-white pr-2"
                            style={{ width: '50%', textAlign: 'right' }}
                        >
                            METAL
                        </span>
                        <span
                            className="animate-heartbeat text-flash transform transition-transform duration-500 text-white pl-2"
                            style={{ width: '50%', textAlign: 'left' }}
                        >
                            AVENUES
                        </span>
                    </h1>
                    <h2 className="text-3xl mt-2 font-semibold tracking-wider flex justify-center heading text-style">
                        <span
                            className="animate-heartbeat text-flash transform transition-transform duration-500 text-white pr-1"
                            style={{ width: '50%', textAlign: 'right' }}
                        >
                            SOFT
                        </span>
                        <span
                            className="animate-heartbeat text-flash transform transition-transform duration-500 text-white pl-[4px]"
                            style={{ width: '50%', textAlign: 'left' }}
                        >
                            WARE
                        </span>
                    </h2>

                    <button
                        onClick={handleClick}
                        className="mt-6 px-8 cursor-pointer py-2 button-style bg-red-800 hover:bg-red-900 text-white font-medium rounded text-lg transition duration-300 shadow-md"
                    >
                        OPEN
                    </button>
                </div>
            )}
        </div>
    );
};

export default FrontPage;
