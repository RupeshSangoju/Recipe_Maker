import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar'; // New import
import Home from './pages/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import History from './pages/History';
import RecipeView from './pages/RecipeView';
import theme from './theme';

// PrivateRoute component to protect routes
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Navbar /> {/* Add top bar here */}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
            <Route path="/recipe/:id" element={<RecipeView />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;