import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Grid,
  Chip,
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import { useKalStore } from './KalStore';

const KalStatsInput = () => {
  const { userStats, updateUserStats } = useKalStore();

  const [localStats, setLocalStats] = useState(userStats);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalStats(userStats);
    setHasChanges(false);
  }, [userStats]);

  const handleChange = (field: string, value: string | number) => {
    const newStats = { ...localStats, [field]: value };
    setLocalStats(newStats);
    setHasChanges(true);
  };

  const handleSave = () => {
    updateUserStats(localStats);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalStats(userStats);
    setHasChanges(false);
  };

  const getBMI = () => {
    const heightM = localStats.height / 100;
    return (localStats.currentWeight / (heightM * heightM)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'info' as const };
    if (bmi < 25) return { label: 'Normal', color: 'success' as const };
    if (bmi < 30) return { label: 'Overweight', color: 'warning' as const };
    return { label: 'Obese', color: 'error' as const };
  };

  const getWeightGoal = () => {
    const diff = localStats.goalWeight - localStats.currentWeight;
    if (Math.abs(diff) < 0.5) return { label: 'Maintain', color: 'success' as const };
    if (diff < 0)
      return { label: `Lose ${Math.abs(diff).toFixed(1)}kg`, color: 'primary' as const };
    return { label: `Gain ${diff.toFixed(1)}kg`, color: 'secondary' as const };
  };

  const bmi = parseFloat(getBMI());
  const bmiCategory = getBMICategory(bmi);
  const weightGoal = getWeightGoal();

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Your Stats
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Name"
              value={localStats.name}
              onChange={(e) => handleChange('name', e.target.value)}
              variant="outlined"
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={localStats.age}
              onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
              variant="outlined"
              slotProps={{ htmlInput: { min: 13, max: 120 } }}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="Height (cm)"
              type="number"
              value={localStats.height}
              onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
              variant="outlined"
              slotProps={{ htmlInput: { min: 100, max: 250 } }}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="Current Weight (kg)"
              type="number"
              value={localStats.currentWeight}
              onChange={(e) =>
                handleChange('currentWeight', parseFloat(e.target.value) || 0)
              }
              variant="outlined"
              slotProps={{ htmlInput: { min: 30, max: 300, step: 0.1 } }}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="Goal Weight (kg)"
              type="number"
              value={localStats.goalWeight}
              onChange={(e) =>
                handleChange('goalWeight', parseFloat(e.target.value) || 0)
              }
              variant="outlined"
              slotProps={{ htmlInput: { min: 30, max: 300, step: 0.1 } }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth>
              <InputLabel>Activity Level</InputLabel>
              <Select
                value={localStats.activityLevel}
                label="Activity Level"
                onChange={(e) => handleChange('activityLevel', e.target.value)}
              >
                <MenuItem value="sedentary">Sedentary (little to no exercise)</MenuItem>
                <MenuItem value="light">Light (light exercise 1-3 days/week)</MenuItem>
                <MenuItem value="moderate">
                  Moderate (moderate exercise 3-5 days/week)
                </MenuItem>
                <MenuItem value="active">Active (hard exercise 6-7 days/week)</MenuItem>
                <MenuItem value="very_active">
                  Very Active (very hard exercise, physical job)
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Chip
                label={`BMI: ${getBMI()} (${bmiCategory.label})`}
                color={bmiCategory.color}
                size="small"
              />
              <Chip label={weightGoal.label} color={weightGoal.color} size="small" />
            </Box>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={!hasChanges}
                fullWidth
              >
                Save Changes
              </Button>

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleReset}
                disabled={!hasChanges}
              >
                Reset
              </Button>
            </Box>
          </Grid>

          {hasChanges && (
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'info.main',
                  color: 'info.contrastText',
                  borderRadius: 1,
                  mt: 1,
                }}
              >
                <Typography variant="body2">
                  💡 Kal will update when you save your changes!
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default KalStatsInput;
