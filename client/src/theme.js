import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      100: '#FF6F61', // Coral
      200: '#FFD700', // Gold
      300: '#6B7280', // Gray
    },
  },
  fonts: {
    heading: `'Poppins', sans-serif`,
    body: `'Roboto', sans-serif`,
  },
});

export default theme;