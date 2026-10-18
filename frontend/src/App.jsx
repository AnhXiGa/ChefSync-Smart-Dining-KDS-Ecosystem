<<<<<<< HEAD
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CustomerMobileMenu from './pages/CustomerMobileMenu';
=======
import { BrowserRouter } from 'react-router-dom'
import './App.css'
import { AppRoutes } from './routes/AppRoutes'
>>>>>>> 49297ccf53caa4bc3cc35b10e614a687dad23d1c

function App() {
  return (
    <BrowserRouter>
<<<<<<< HEAD
      <Routes>
        <Route path="/" element={<CustomerMobileMenu />} />
        <Route path="/menu" element={<CustomerMobileMenu />} />
      </Routes>
    </BrowserRouter>
  );
=======
      <AppRoutes />
    </BrowserRouter>
  )
>>>>>>> 49297ccf53caa4bc3cc35b10e614a687dad23d1c
}

export default App;
