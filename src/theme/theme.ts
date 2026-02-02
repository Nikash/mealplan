import { ThemeOptions } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#1e6c79',
    },
    secondary: {
      main: '#792b1e',
    },
  },
};


export const theme = createTheme(themeOptions);