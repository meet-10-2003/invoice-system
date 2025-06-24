import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import userImage from '../images/user-2(2).png'; 

const Login = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false); 
  const navigate = useNavigate();

  const handleCloseModal = () => {
    setShowModal(false);
    setEmail("");
    setPassword("");
  };

  const handleLogin = () => {
  if (email !== 'metalpurchase@gmail.com' || password !== 'metal@2nd57356') {
    setShowModal(true);
    return;
  }

  setIsLoggingIn(true); // ✅ show spinner only for valid credentials

  setTimeout(() => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.removeItem('invoiceProducts'); // ✅ clear old data
    setIsLoggedIn(true);
    navigate('/job-sheet');
    setIsLoggingIn(false); // stop spinner
  }, 1000);
};


  return (
    <div className="h-screen items-center bg-gradient-to-tr from-blue-500 via-pink-500 to-purple-600">
      <aside className='flex h-screen items-center justify-center'>
        <div className='flex items-center gap-28 bg-gray-100 px-8 py-12 rounded-2xl'>

          {/* Left Side - Image */}
          <div className='flex items-center bg-gray-300 rounded-full pb-4 pt-1 px-2 shadow-xl'>
            <div className="w-[150px] hidden h-[150px] md:block">
              <img
                src={userImage}
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex items-center justify-center">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="rounded-xl w-[300px] max-w-md"
            >
              <h2 className="text-2xl font-bold mb-6 tracking-tight uppercase">User Login</h2>

              <div className='flex border items-center gap-2 px-4 py-2 mb-3 rounded-[50px]'>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className='w-5 h-5' fill="currentColor">
                  <path d="M21 3C21.5523 3 22 3.44772 22 4V20.0066C22 20.5552 21.5447 21 21.0082 21H2.9918C2.44405 21 2 20.5551 2 20.0066V19H20V7.3L12 14.5L2 5.5V4C2 3.44772 2.44772 3 3 3H21ZM8 15V17H0V15H8ZM5 10V12H0V10H5ZM19.5659 5H4.43414L12 11.8093L19.5659 5Z" />
                </svg>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full outline-none font-[600] tracking-tight placeholder:tracking-tight placeholder:font-[600]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className='flex border items-center gap-2 px-4 py-2 mb-6 rounded-[50px]'>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className='w-5 h-5' fill="currentColor">
                  <path d="M19 10H20C20.5523 10 21 10.4477 21 11V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V11C3 10.4477 3.44772 10 4 10H5V9C5 5.13401 8.13401 2 12 2C15.866 2 19 5.13401 19 9V10ZM5 12V20H19V12H5ZM11 14H13V18H11V14ZM17 10V9C17 6.23858 14.7614 4 12 4C9.23858 4 7 6.23858 7 9V10H17Z" />
                </svg>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full font-[600] tracking-tight outline-none placeholder:tracking-tight placeholder:font-[600]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full tracking-tight font-[600] bg-green-500 cursor-pointer text-white py-2 rounded-[50px] transition-all duration-300 hover:bg-green-700"
              >
                Login
              </button>
            </form>

            {showModal && (
              <Modal
                title="Login Failed"
                message1="The email or password you entered doesn't match our records."
                message2="Please double-check your login details and try again."
                onClose={handleCloseModal}
              />
            )}

            {isLoggingIn && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="w-12 h-12 border-4 border-white border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Login;
