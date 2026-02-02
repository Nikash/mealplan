import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import SaveIcon from '@mui/icons-material/Save';

const options = ['Fish Tacos', 'Cabbage Palya', 'Halsindekal saaru'];

export default function Recommend() {
  return (
    <main className="flex flex-col items-center max-h-screen p-24">
      <div className="flex flex-col items-center min-h-full max-w-5xl w-full">

        <Typography
          variant="h5"
          noWrap
          textAlign="center"
          sx={{
            fontFamily: "monospace",
            fontWeight: { xs: 100, md: 300 },
            letterSpacing: ".3rem"
          }}
        >
          Today, you should have 
        </Typography>
        
        <Typography
          variant="h2"
          noWrap
          textAlign="center"
          sx={{
            paddingTop: 10, 
            fontFamily: "monospace",
            fontWeight: { xs: 300, md: 700 },
            letterSpacing: ".3rem"
          }}
        >
          {options[Math.floor(Math.random()*options.length)]}
        </Typography>
      </div>
    </main>
  )
}
