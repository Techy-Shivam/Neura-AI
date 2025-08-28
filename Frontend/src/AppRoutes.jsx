import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import React from 'react'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import Intro from './pages/Intro'

const AppRoutes = () => {
  // check login status (from localStorage or cookies)
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<Intro />} />

        {/* Protected route → only if logged in */}
        <Route
          path="/chat"
          element={isLoggedIn ? <Home /> : <Navigate to="/login" />}
        />

        {/* Auth routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
