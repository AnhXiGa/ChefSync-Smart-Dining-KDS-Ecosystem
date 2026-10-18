import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CustomerMobileMenu from './pages/CustomerMobileMenu';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerMobileMenu />} />
        <Route path="/menu" element={<CustomerMobileMenu />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
