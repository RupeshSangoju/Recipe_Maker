import React, { useState } from 'react';
import { Box, Heading, Text, Image, VStack, Button, HStack } from '@chakra-ui/react';
import { FaVolumeUp, FaShareAlt, FaClock } from 'react-icons/fa';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

function ChefShow({ recipe, steps, language, imageUrl, recipeId }) {
  const [timers, setTimers] = useState(steps.map(() => ({ active: false, timeLeft: null })));

  const readAloud = () => {
    const speech = new SpeechSynthesisUtterance(`${recipe}. Here are the steps: ${steps.map(s => s.instruction).join('. ')}`);
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

  const startTimer = (index, timeStr) => {
    if (!timeStr) return;
    const time = parseInt(timeStr) * 60; // Convert minutes to seconds
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
            <Image src={imageUrl} alt="Dish" maxW="100%" maxH="300px" objectFit="cover" borderRadius="md" shadow="md" />
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
        </HStack>
      </VStack>
    </MotionBox>
  );
}

export default ChefShow;