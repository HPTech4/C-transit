import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

import './App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register'

function App() {
  return (
    <Router>
      <Routes>
        {/* Default Redirect */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  )
     
}

export default App

