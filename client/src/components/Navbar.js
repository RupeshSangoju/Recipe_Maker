import React from 'react';
import { Box, Heading, HStack, Button, Text } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      as="nav"
      bg="brand.100"
      color="white"
      p={4}
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={10}
      boxShadow="md"
    >
      <HStack justify="space-between" maxW="1200px" mx="auto">
        <Heading size="md" onClick={() => navigate('/')} cursor="pointer">
          AI Cooking Chaos Show
        </Heading>
        <HStack spacing={4}>
          {user ? (
            <>
              <Text>Welcome, {user.username}!</Text>
              <Button variant="outline" colorScheme="whiteAlpha" onClick={() => navigate('/')}>
                Home
              </Button>
              <Button variant="outline" colorScheme="whiteAlpha" onClick={() => navigate('/history')}>
                History
              </Button>
              <Button variant="outline" colorScheme="whiteAlpha" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" colorScheme="whiteAlpha" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button variant="outline" colorScheme="whiteAlpha" onClick={() => navigate('/signup')}>
                Signup
              </Button>
            </>
          )}
        </HStack>
      </HStack>
    </Box>
  );
}

export default Navbar;