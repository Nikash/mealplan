import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';

import SaveIcon from '@mui/icons-material/Save';


export default function Record() {
  return (
    <main className="flex flex-col items-center max-h-screen p-24">
      <div className="flex flex-col items-center max-w-5xl w-full">
      
        <div className="pb-2 flex md:flex-row flex-col justify-center items-center"> 
          <FormControlLabel control={<Checkbox />} label="Take Out" />
          <div className="md:pl-20">
            <FormControlLabel control={<Checkbox />} label="Dine Out" />
          </div>
        </div>

        <TextField fullWidth id="outlined-basic" label="What did you have for dinner today?" variant="standard" sx={{pb: 2}} />
        <TextField fullWidth id="outlined-basic" label="Where did you get it from? (If applicable)" variant="standard" />

        <div className="pt-10">
          <Button variant="outlined" startIcon={<SaveIcon />}>
            Save
          </Button>
        </div>
      </div>
    </main>
  )
}
