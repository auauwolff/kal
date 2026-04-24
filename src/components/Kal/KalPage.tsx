import { Box, Typography } from '@mui/material';
import KalPet from './KalPet';

const KalPage = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        p: 2,
      }}
    >
      {/* Simple Header */}
      <Typography variant="h4" component="h1" gutterBottom color="primary" sx={{ mb: 4 }}>
        🐾 Kal Your Fitness Pal
      </Typography>

      {/* Interactive Kal Pet with Animated Eyes */}
      <KalPet />
    </Box>
  );
};

export default KalPage;