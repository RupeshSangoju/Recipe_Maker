import React, { useState, useEffect } from 'react';
import { Box, Heading, VStack, Text, Button } from '@chakra-ui/react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MotionBox = motion.create(Box);

function History() {
  const [recipes, setRecipes] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      axios.get(`${process.env.REACT_APP_API_URL}/api/recipes/history`, {
        headers: { 'x-user-id': user.userId },
      })
        .then(res => setRecipes(res.data))
        .catch(err => console.error('History fetch error:', err));
    }
  }, [user]);

  return (
    <MotionBox p={8} maxW="800px" mx="auto" mt={10}>
      <Heading mb={6} color="brand.100">Your Recipe History</Heading>
      <VStack spacing={4}>
        {recipes.map((r) => (
          <MotionBox
            key={r._id}
            p={4}
            bg="gray.100"
            borderRadius="md"
            w="100%"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Text fontWeight="bold">{r.recipe}</Text>
            <Text fontSize="sm" color="gray.600">{new Date(r.createdAt).toLocaleDateString()}</Text>
            <Button
              size="sm"
              mt={2}
              colorScheme="brand"
              onClick={() => navigate(`/recipe/${r._id}`)}
            >
              View Recipe
            </Button>
          </MotionBox>
        ))}
      </VStack>
    </MotionBox>
  );
}

export default History;