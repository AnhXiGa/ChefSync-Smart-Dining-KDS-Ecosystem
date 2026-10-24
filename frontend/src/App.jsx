import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CustomerMobileMenu from './pages/CustomerMobileMenu';
import InventoryManagement from './pages/InventoryManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerMobileMenu />} />
        <Route path="/menu" element={<CustomerMobileMenu />} />
        <Route path="/inventory" element={<InventoryManagement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
