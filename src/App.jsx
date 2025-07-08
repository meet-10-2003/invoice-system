// App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import InvoicePage from './components/invoicePage';
import FinalInvoice from './components/FinalInvoice';
import ProtectedRoute from './components/ProtectedRoute';
import InvoiceHistory from './components/InvoiceHistory';
import JobSheetPage from './components/JobSheetPage';
import JobSheetHistory from './components/JobSheetHistory';
import JobSheetEdit from './components/JobSheetEdit'; // Adjust the path as needed
import GeneratePI from './components/GeneratePI';
import FrontPage from './components/FrontPage'; // ✅ Import it



function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />

        <Route
          path="/invoice"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <InvoicePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/job-sheet"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <JobSheetPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/job-sheet/edit/:orderNo"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <JobSheetEdit />
            </ProtectedRoute>
          }
        />

        <Route path="/job-history" element={<JobSheetHistory />} />

        <Route
          path="/final-invoice"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <FinalInvoice />
            </ProtectedRoute>
          }
        />

        <Route path="/generate-pi/:orderNo" element={<GeneratePI />} />


        <Route path="/invoice-history" element={<InvoiceHistory />} />
      </Routes>
    </Router>
  );
}

export default App;
