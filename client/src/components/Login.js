import React, { useState } from 'react';
import { Box, Heading, Button, VStack, Text } from '@chakra-ui/react';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      maxW="400px"
      mx="auto"
      mt={20}
      p={6}
      bg="gray.900" // Darker bg for contrast
      borderRadius="lg"
      shadow="lg"
    >
      <Heading mb={6} textAlign="center" color="brand.100">Login</Heading>
      {error && <Text color="red.500" mb={4}>{error}</Text>}
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl>
            <FormLabel color="gray.200">Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              bg="gray.800"
              color="white"
              borderColor="brand.200"
            />
          </FormControl>
          <FormControl>
            <FormLabel color="gray.200">Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              bg="gray.800"
              color="white"
              borderColor="brand.200"
            />
          </FormControl>
          <Button
            type="submit"
            width="full"
            isDisabled={!email || !password}
            bg="green.400" // Neon green
            color="black"
            _hover={{ bg: 'pink.500', transform: 'scale(1.05)' }} // Magenta hover
            transition="all 0.2s"
          >
            Login
          </Button>
        </VStack>
      </form>
    </MotionBox>
  );
}

export default Login;