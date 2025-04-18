import React, { useState, useEffect } from 'react';
import { Box, Heading, VStack, Text, Image, Button, Radio, RadioGroup, Stack } from '@chakra-ui/react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const MotionBox = motion.create(Box);

function RecipeView() {
  const [recipeData, setRecipeData] = useState(null);
  const [shareOption, setShareOption] = useState('share');
  const [downloadType, setDownloadType] = useState('pdf');
  const { id } = useParams();

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/recipes/${id}`)
      .then((res) => setRecipeData(res.data))
      .catch((err) => console.error('Recipe fetch error:', err));
  }, [id]);

  const handleAction = () => {
    if (shareOption === 'share') {
      // Share logic (e.g., copy URL)
      const shareUrl = `${window.location.origin}/recipes/${id}`;
      navigator.clipboard.writeText(shareUrl);
      alert('Recipe URL copied to clipboard!');
    } else {
      if (downloadType === 'pdf') {
        generatePDF();
      } else {
        generateImage();
      }
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Chaos Recipe', 10, 10);
    doc.setFontSize(14);
    doc.text(`Dish: ${recipeData.recipe}`, 10, 20);
    doc.text('Ingredients:', 10, 30);
    recipeData.ingredients.forEach((item, i) => doc.text(`- ${item}`, 15, 40 + i * 10));
    doc.text('Instructions:', 10, 40 + recipeData.ingredients.length * 10);
    recipeData.steps.forEach((step, i) => {
      doc.text(`${step.stepNumber}. ${step.instruction}`, 15, 50 + recipeData.ingredients.length * 10 + i * 10);
      if (step.time) doc.text(` (${step.time})`, 20, 60 + recipeData.ingredients.length * 10 + i * 10);
    });
    doc.save(`chaos_recipe_${id}.pdf`);
  };

  const generateImage = async () => {
    const element = document.getElementById('recipe-content');
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `chaos_recipe_${id}.png`;
    link.click();
  };

  if (!recipeData) return <Text>Loading...</Text>;

  return (
    <MotionBox p={8} maxW="800px" mx="auto" mt={10} bg="gray.900" borderRadius="lg" shadow="lg">
      <Heading mb={6} color="brand.100">{recipeData.recipe}</Heading>
      <VStack spacing={6} align="stretch" id="recipe-content">
        {recipeData.imageUrl && (
          <Image
            src={recipeData.imageUrl}
            alt="Dish"
            maxW="100%"
            maxH="300px"
            objectFit="cover"
            borderRadius="md"
          />
        )}
        <Box>
          <Heading size="sm" color="brand.200" mb={4}>
            Ingredients
          </Heading>
          <Text color="gray.200">{recipeData.ingredients.join(', ')}</Text>
        </Box>
        <Box>
          <Heading size="sm" color="brand.200" mb={4}>
            Steps
          </Heading>
          {recipeData.steps.map((step) => (
            <Box key={step.stepNumber} p={4} bg="gray.800" borderRadius="md" mb={2}>
              <Text fontWeight="bold" color="gray.100">
                Step {step.stepNumber}
              </Text>
              <Text color="gray.200">{step.instruction}</Text>
              {step.time && <Text color="gray.400">({step.time})</Text>}
            </Box>
          ))}
        </Box>
      </VStack>
      <Box mt={8}>
        <RadioGroup onChange={setShareOption} value={shareOption} mb={4}>
          <Stack direction="row" spacing={5}>
            <Radio value="share" colorScheme="green">
              Share Recipe
            </Radio>
            <Radio value="dont-share" colorScheme="orange">
              Don’t Share
            </Radio>
          </Stack>
        </RadioGroup>
        {shareOption === 'dont-share' && (
          <RadioGroup onChange={setDownloadType} value={downloadType} mb={4}>
            <Stack direction="row" spacing={5}>
              <Radio value="pdf" colorScheme="green">
                Download as PDF
              </Radio>
              <Radio value="image" colorScheme="orange">
                Download as Image
              </Radio>
            </Stack>
          </RadioGroup>
        )}
        <Button
          onClick={handleAction}
          bg={shareOption === 'share' ? 'green.400' : 'orange.400'}
          color="white"
          _hover={{ bg: shareOption === 'share' ? 'pink.500' : 'green.400', transform: 'scale(1.05)' }}
          transition="all 0.2s"
        >
          {shareOption === 'share' ? 'Share' : 'Download'}
        </Button>
      </Box>
    </MotionBox>
  );
}

export default RecipeView;