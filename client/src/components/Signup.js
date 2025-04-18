import React, { useState } from 'react';
import { Box, Heading, Button, VStack, Text } from '@chakra-ui/react';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    try {
      await signup(email, password, username);
      navigate('/login');
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
      bg="gray.900" // Darker bg
      borderRadius="lg"
      shadow="lg"
    >
      <Heading mb={6} textAlign="center" color="brand.100">Signup</Heading>
      {error && <Text color="red.500" mb={4}>{error}</Text>}
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl>
            <FormLabel color="gray.200">Username</FormLabel>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              bg="gray.800"
              color="white"
              borderColor="brand.200"
            />
          </FormControl>
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
          <FormControl>
            <FormLabel color="gray.200">Re-enter Password</FormLabel>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              bg="gray.800"
              color="white"
              borderColor="brand.200"
            />
          </FormControl>
          <Button
            type="submit"
            width="full"
            bg="orange.400" // Fiery orange
            color="white"
            _hover={{ bg: 'green.400', transform: 'scale(1.05)' }} // Green hover
            transition="all 0.2s"
          >
            Signup
          </Button>
          <Text>
            Already have an account?{' '}
            <Button as={Link} to="/login" variant="link" color="brand.100">
              Login
            </Button>
          </Text>
        </VStack>
      </form>
    </MotionBox>
  );
}

export default Signup;