import { createTheme } from '@mui/material/styles';

// A color palette inspired by the provided image
const cafeTheme = createTheme({
  palette: {
    primary: {
      main: '#E55B3C', // A warm, reddish-orange for primary actions
    },
    secondary: {
      main: '#F8E6E6', // A darker pink for secondary elements
    },
    background: {
      default: '#FCF4F4', // A very light, soft pink for the main background
      paper: '#FFFFFF',   // White for paper elements
    },
    text: {
      primary: '#3E2723', // A dark brown for primary text
      secondary: '#5D4037', // A slightly lighter brown for secondary text
    },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    button: {
      fontWeight: 600,
      textTransform: 'none', 
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#FCF4F4', // Applying the new default background color
        },
      },
    },
    MuiButton: {
        styleOverrides: {
            root: {
                borderRadius: 8, // Rounded corners for buttons
            }
        }
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: 12, // Rounded corners for paper elements
            }
        }
    }
  },
});

export default cafeTheme;
