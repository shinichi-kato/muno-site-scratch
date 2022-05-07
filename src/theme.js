import { red } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';

// A custom theme for this app
const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
  },
  typography: {
    h2: {
      fontSize: "2.5rem"
    },
    h3: {
      fontSize: "1.8rem"
    },
    h4: {
      fontSize: "1.5rem"
    }
  }
});

export default theme;
