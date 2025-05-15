import React, { useState, useEffect } from 'react';
import { Box, Heading, VStack, Button, Checkbox, Select, HStack, IconButton, Text, Radio, RadioGroup, Stack, Alert, AlertIcon } from '@chakra-ui/react';
import { FormControl } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { FaPlus, FaTrash, FaUtensils } from 'react-icons/fa';
import axios from 'axios';
import ChefShow from '../components/ChefShow';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MotionBox = motion.create(Box);

function Home() {
  const [mode, setMode] = useState('ingredients');
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [recipe, setRecipe] = useState(null);
  const [steps, setSteps] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [recipeId, setRecipeId] = useState(null);
  const [difficultyMode, setDifficultyMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [cookingStyle, setCookingStyle] = useState('modern');
  const [servingSize, setServingSize] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'hi', label: 'Hindi' },
  ];

  const cookingStyles = ['modern', 'traditional', 'fusion', 'experimental'];

  const addIngredient = () => setIngredients([...ingredients, '']);
  const removeIngredient = (index) => setIngredients(ingredients.filter((_, i) => i !== index));
  const updateIngredient = (index, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const generateRecipe = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    setLoading(true);
    setError(null);
    try {
      let response;
      if (mode === 'recipe-name') {
        console.log('Generating recipe from name with URL:', `${API_URL}/api/generate-from-name`);
        response = await axios.post(
          `${API_URL}/api/generate-from-name`,
          {
            recipeName,
            language,
            servingSize,
          },
          { headers: { 'x-user-id': user.userId } }
        );
      } else {
        console.log('Generating recipe with URL:', `${API_URL}/api/generate-recipe`);
        response = await axios.post(
          `${API_URL}/api/generate-recipe`,
          {
            ingredients: ingredients.filter((i) => i.trim() !== ''),
            difficultyMode,
            language,
            cookingStyle,
            servingSize,
          },
          { headers: { 'x-user-id': user.userId } }
        );
      }
      console.log('Recipe response:', response.data);
      setRecipe(response.data.recipe);
      setSteps(response.data.steps);
      setIngredientsList(response.data.ingredients);
      setImageUrl(response.data.imageUrl); // Use the full URL from backend
      setRecipeId(response.data.recipeId);
    } catch (error) {
      console.error('Error fetching recipe:', error.response?.data || error.message);
      setError(error.response?.data?.error || 'Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      p={8}
      maxW="800px"
      mx="auto"
      mt={16}
      bg="blue.100"
      borderRadius="lg"
      shadow="lg"
    >
      <Heading mb={6} color="brand.100" textAlign="center">
        AI Cooking Chaos Show
      </Heading>
      <VStack spacing={6} align="stretch">
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
        <RadioGroup onChange={setMode} value={mode} mb={4}>
          <Stack direction="row" spacing={5}>
            <Radio value="recipe-name" colorScheme="green">
              I Know the Recipe Name
            </Radio>
            <Radio value="ingredients" colorScheme="orange">
              I Have Ingredients
            </Radio>
          </Stack>
        </RadioGroup>

        {mode === 'recipe-name' ? (
          <Box>
            <Text fontWeight="bold" mb={2} color="gray.500">
              Recipe Name
            </Text>
            <FormControl>
              <Input
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="E.g., Chicken Curry"
                variant="filled"
                bg="gray.800"
                color="white"
                _hover={{ bg: 'gray.700' }}
              />
            </FormControl>
            <HStack spacing={4} mt={4}>
              <Box flex={1}>
                <Text fontWeight="bold" mb={2} color="gray.500">
                  Language
                </Text>
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  variant="filled"
                  bg="gray.800"
                  color="white"
                  _hover={{ bg: 'gray.700' }}
                  _focus={{ bg: 'gray.700', borderColor: 'green.400' }}
                  sx={{
                    '& > option': {
                      bg: 'gray.700',
                      color: 'white',
                    },
                  }}
                >
                  {languageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </Box>
              <Box flex={1}>
                <Text fontWeight="bold" mb={2} color="gray.500">
                  Serving Size
                </Text>
                <Input
                  type="number"
                  value={servingSize}
                  onChange={(e) => setServingSize(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  variant="filled"
                  bg="gray.800"
                  color="white"
                  _hover={{ bg: 'gray.700' }}
                />
              </Box>
            </HStack>
          </Box>
        ) : (
          <>
            <Box>
              <Text fontWeight="bold" mb={2} color="gray.500">
                Ingredients
              </Text>
              {ingredients.map((ing, index) => (
                <HStack key={index} mb={2}>
                  <FormControl>
                    <Input
                      value={ing}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      placeholder={`Ingredient ${index + 1}`}
                      variant="filled"
                      bg="gray.800"
                      color="white"
                      _hover={{ bg: 'gray.700' }}
                    />
                  </FormControl>
                  {ingredients.length > 1 && (
                    <IconButton
                      icon={<FaTrash />}
                      colorScheme="red"
                      onClick={() => removeIngredient(index)}
                    />
                  )}
                </HStack>
              ))}
              <Button
                leftIcon={<FaPlus />}
                onClick={addIngredient}
                colorScheme="green"
                size="sm"
                mt={2}
              >
                Add Ingredient
              </Button>
            </Box>

            <Checkbox
              isChecked={difficultyMode}
              onChange={() => setDifficultyMode(!difficultyMode)}
              colorScheme="brand"
              color="gray.500"
            >
              Chef Difficulty Mode (Chaotic Recipes)
            </Checkbox>

            <HStack spacing={4}>
              <Box flex={1}>
                <Text fontWeight="bold" mb={2} color="gray.500">
                  Language
                </Text>
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  variant="filled"
                  bg="gray.800"
                  color="white"
                  _hover={{ bg: 'gray.700' }}
                  _focus={{ bg: 'gray.700', borderColor: 'green.400' }}
                  sx={{
                    '& > option': {
                      bg: 'gray.700',
                      color: 'white',
                    },
                  }}
                >
                  {languageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </Box>
              <Box flex={1}>
                <Text fontWeight="bold" mb={2} color="gray.500">
                  Cooking Style
                </Text>
                <Select
                  value={cookingStyle}
                  onChange={(e) => setCookingStyle(e.target.value)}
                  variant="filled"
                  bg="gray.800"
                  color="white"
                  _hover={{ bg: 'gray.700' }}
                  _focus={{ bg: 'gray.700', borderColor: 'green.400' }}
                  sx={{
                    '& > option': {
                      bg: 'gray.700',
                      color: 'white',
                    },
                  }}
                >
                  {cookingStyles.map((style) => (
                    <option key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </option>
                  ))}
                </Select>
              </Box>
            </HStack>

            <Box>
              <Text fontWeight="bold" mb={2} color="gray.500">
                Serving Size
              </Text>
              <FormControl>
                <Input
                  type="number"
                  value={servingSize}
                  onChange={(e) => setServingSize(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  variant="filled"
                  bg="gray.800"
                  color="white"
                  _hover={{ bg: 'gray.700' }}
                />
              </FormControl>
            </Box>
          </>
        )}

        <Button
          leftIcon={<FaUtensils />}
          onClick={generateRecipe}
          isLoading={loading}
          loadingText="Cooking..."
          bg="pink.500"
          color="white"
          size="lg"
          borderRadius="full"
          _hover={{ bg: 'green.400', transform: 'scale(1.05)' }}
          _active={{ bg: 'pink.600' }}
          transition="all 0.3s"
          isDisabled={mode === 'recipe-name' ? !recipeName : ingredients.every((i) => !i.trim())}
        >
          Generate Recipe
        </Button>

        {recipe && steps.length > 0 && (
          <ChefShow
            recipe={recipe}
            steps={steps}
            ingredients={ingredientsList}
            language={language}
            imageUrl={imageUrl}
            recipeId={recipeId}
            servingSize={servingSize}
          />
        )}
      </VStack>
    </MotionBox>
  );
}

export default Home;