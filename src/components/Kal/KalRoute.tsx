import { Box } from '@mui/material';

export const KalRoute = () => (
  <Box
    sx={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
    }}
  >
    <Box
      component="img"
      src="/kal-fat.svg"
      alt="Kal"
      sx={{ width: '70%', maxWidth: 320, height: 'auto' }}
    />
  </Box>
);
