import React, { useState } from 'react';
import { Box, Heading, Text, Image, VStack, Button, HStack, List, ListItem } from '@chakra-ui/react';
import { FaVolumeUp, FaShareAlt, FaClock, FaFilePdf } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const MotionBox = motion.create(Box);

function ChefShow({ recipe, steps, ingredients, language, imageUrl, recipeId, servingSize }) {
  const [timers, setTimers] = useState(steps.map(() => ({ active: false, timeLeft: null })));

  const readAloud = () => {
    const speech = new SpeechSynthesisUtterance(`${recipe}. Ingredients: ${ingredients.join(', ')}. Steps: ${steps.map(s => s.instruction).join('. ')}`);
    speech.lang = language || 'en-US';
    speech.rate = 1.1;
    speech.pitch = 1.2;
    window.speechSynthesis.speak(speech);
  };

  const shareRecipe = () => {
    const shareUrl = `${window.location.origin}/recipe/${recipeId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Recipe URL copied to clipboard!');
  };

  const generatePDF = async () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Colors and fonts
    const primaryColor = '#FF6B6B'; // Coral
    const secondaryColor = '#4ECDC4'; // Teal
    pdf.setFont('Helvetica', 'bold');

    // Gradient background
    pdf.setFillColor(255, 245, 230); // Light peach
    pdf.rect(0, 0, 210, 297, 'F'); // A4 size
    for (let i = 0; i < 297; i += 2) {
      pdf.setDrawColor(255, 107, 107, 0.1 * (i / 297));
      pdf.line(0, i, 210, i);
    }

    // Border
    pdf.setLineWidth(2);
    pdf.setDrawColor(primaryColor);
    pdf.rect(5, 5, 200, 287, 'S');

    // Header
    pdf.setFontSize(24);
    pdf.setTextColor(secondaryColor);
    pdf.text('AI Cooking Chaos Show', 105, 20, { align: 'center' });
    pdf.setFontSize(12);
    pdf.setTextColor(100);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });

    // Recipe Title
    pdf.setFontSize(18);
    pdf.setTextColor(primaryColor);
    pdf.text(recipe, 20, 40);

    // Image
    try {
      const imgElement = document.querySelector(`img[src="${imageUrl}"]`);
      if (imgElement) {
        const canvas = await html2canvas(imgElement, { scale: 2 });
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        pdf.addImage(imgData, 'JPEG', 20, 50, 80, 60);
      }
    } catch (error) {
      console.error('Image capture error:', error);
      pdf.setTextColor(100);
      pdf.text('Image not available', 20, 60);
    }

    // Serving Size
    pdf.setFontSize(14);
    pdf.setTextColor(secondaryColor);
    pdf.text(`Serves: ${servingSize}`, 20, 120);

    // Ingredients
    pdf.setFontSize(14);
    pdf.setTextColor(primaryColor);
    pdf.text('Ingredients', 20, 130);
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(0);
    let y = 140;
    ingredients.forEach((ingredient, index) => {
      pdf.text(`• ${ingredient}`, 25, y);
      y += 6;
    });

    // Steps
    pdf.setFontSize(14);
    pdf.setTextColor(primaryColor);
    pdf.text('Steps', 20, y + 10);
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(0);
    y += 20;
    steps.forEach((step) => {
      if (y > 260) {
        pdf.addPage();
        y = 20;
        pdf.setFillColor(255, 245, 230);
        pdf.rect(0, 0, 210, 297, 'F');
        pdf.setLineWidth(2);
        pdf.setDrawColor(primaryColor);
        pdf.rect(5, 5, 200, 287, 'S');
      }
      pdf.text(`Step ${step.stepNumber}: ${step.instruction}`, 25, y, { maxWidth: 160 });
      if (step.time) pdf.text(`(${step.time})`, 170, y);
      y += 10 + Math.ceil(pdf.getTextDimensions(step.instruction, { maxWidth: 160 }).h / 2);
    });

    // Footer
    pdf.setFontSize(10);
    pdf.setTextColor(secondaryColor);
    pdf.text('Cook with Chaos, Savor the Magic!', 105, 287, { align: 'center' });

    // Save PDF
    pdf.save(`${recipe.replace(/\s+/g, '_')}_ChaosRecipe.pdf`);
  };

  const startTimer = (index, timeStr) => {
    if (!timeStr) return;
    const timeMatch = timeStr.match(/(\d+)/);
    if (!timeMatch) return;
    const time = parseInt(timeMatch[0]) * 60; // Convert minutes to seconds
    const newTimers = [...timers];
    newTimers[index] = { active: true, timeLeft: time };
    setTimers(newTimers);

    const interval = setInterval(() => {
      setTimers(prev => {
        const updated = [...prev];
        if (updated[index].timeLeft > 0) {
          updated[index].timeLeft -= 1;
        } else {
          updated[index].active = false;
          clearInterval(interval);
          alert(`Step ${index + 1} is done!`);
        }
        return updated;
      });
    }, 1000);
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      p={6}
      bg="white"
      borderRadius="lg"
      shadow="lg"
      mt={6}
    >
      <VStack spacing={6} align="stretch">
        <Heading size="md" color="brand.100" mb={4}>{recipe}</Heading>
        {imageUrl && (
          <Box textAlign="center">
            <Image
              src={imageUrl}
              alt={recipe}
              maxW="100%"
              maxH="300px"
              objectFit="cover"
              borderRadius="md"
              shadow="md"
              fallbackSrc="https://via.placeholder.com/300?text=Image+Not+Found"
            />
          </Box>
        )}
        {ingredients && ingredients.length > 0 && (
          <Box>
            <Heading size="sm" color="brand.200" mb={2}>Ingredients</Heading>
            <List spacing={1}>
              {ingredients.map((ingredient, index) => (
                <ListItem key={index} color="gray.700">• {ingredient}</ListItem>
              ))}
            </List>
          </Box>
        )}
        <Box>
          <Heading size="sm" color="brand.200" mb={4}>Steps</Heading>
          {steps.map((step, index) => (
            <MotionBox
              key={step.stepNumber}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: step.stepNumber * 0.1 }}
              p={4}
              bg="gray.100"
              borderRadius="md"
              mb={2}
            >
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="bold">Step {step.stepNumber}</Text>
                  <Text>{step.instruction}</Text>
                </Box>
                {step.time && (
                  <Button
                    size="sm"
                    leftIcon={<FaClock />}
                    colorScheme="teal"
                    onClick={() => startTimer(index, step.time)}
                    isDisabled={timers[index].active}
                  >
                    {timers[index].active ? `${Math.floor(timers[index].timeLeft / 60)}:${(timers[index].timeLeft % 60).toString().padStart(2, '0')}` : step.time}
                  </Button>
                )}
              </HStack>
            </MotionBox>
          ))}
        </Box>
        <HStack spacing={4}>
          <Button leftIcon={<FaVolumeUp />} colorScheme="brand" variant="outline" onClick={readAloud}>
            Read Aloud
          </Button>
          <Button leftIcon={<FaShareAlt />} colorScheme="brand" variant="outline" onClick={shareRecipe}>
            Share Recipe
          </Button>
          <Button leftIcon={<FaFilePdf />} colorScheme="pink" variant="solid" onClick={generatePDF}>
            Download PDF
          </Button>
        </HStack>
      </VStack>
    </MotionBox>
  );
}

export default ChefShow;