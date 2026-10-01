import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.js';
import OrderList from './pages/OrderList.js';
import OrderDetail from './pages/OrderDetail.js';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100">
        <Navbar />

        <main className="p-4 md:p-6 lg:max-w-7xl lg:mx-auto">
          <Routes>
            <Route path="/" element={<OrderList />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
