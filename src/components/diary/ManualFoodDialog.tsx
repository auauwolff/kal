import { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Dialog,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useMutation } from 'convex/react';
import toast from 'react-hot-toast';
import { NumberField } from '@/components/NumberField';
import { api } from '../../../convex/_generated/api';
import { MEAL_LABELS, type MealType } from './types';
import { useDiary } from './useDiary';
import { errorMessage } from '@/lib/errors';

interface ManualFoodDialogProps {
  open: boolean;
  mealType: MealType;
  initialName?: string;
  onClose: () => void;
  onLogged?: () => void;
}

export const ManualFoodDialog = ({
  open,
  mealType,
  initialName = '',
  onClose,
  onLogged,
}: ManualFoodDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const createCustom = useMutation(api.foods.createCustom);
  const { addEntry } = useDiary();

  const [name, setName] = useState(initialName);
  const [brand, setBrand] = useState('');
  const [defaultServingG, setDefaultServingG] = useState(100);
  const [calories, setCalories] = useState(0);
  const [proteinG, setProteinG] = useState(0);
  const [carbsG, setCarbsG] = useState(0);
  const [fatG, setFatG] = useState(0);
  const [fiberG, setFiberG] = useState<number | ''>('');
  const [sugarG, setSugarG] = useState<number | ''>('');
  const [sodiumMg, setSodiumMg] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setName('');
    setBrand('');
    setDefaultServingG(100);
    setCalories(0);
    setProteinG(0);
    setCarbsG(0);
    setFatG(0);
    setFiberG('');
    setSugarG('');
    setSodiumMg('');
  };

  const canSubmit =
    name.trim().length > 0 &&
    defaultServingG > 0 &&
    calories >= 0 &&
    proteinG >= 0 &&
    carbsG >= 0 &&
    fatG >= 0;

  const handleSave = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const foodId = await createCustom({
        name: name.trim(),
        ...(brand.trim() ? { brand: brand.trim() } : {}),
        defaultServingG,
        nutrientsPer100g: {
          calories,
          proteinG,
          carbsG,
          fatG,
          ...(fiberG !== '' ? { fiberG } : {}),
          ...(sugarG !== '' ? { sugarG } : {}),
          ...(sodiumMg !== '' ? { sodiumMg } : {}),
        },
        commonPortions: [],
      });
      await addEntry({
        mealType,
        foodId,
        quantityG: defaultServingG,
      });
      toast.success(`${name.trim()} added to ${MEAL_LABELS[mealType]}`);
      reset();
      onLogged?.();
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save food'));
    } finally {
      setBusy(false);
    }
  };

  const requiredNumField = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    suffix: string,
  ) => (
    <NumberField
      label={label}
      value={value}
      size="small"
      onChange={onChange}
      slotProps={{
        input: {
          endAdornment: <InputAdornment position="end">{suffix}</InputAdornment>,
        },
        htmlInput: { min: 0, inputMode: 'decimal', step: 0.1 },
      }}
    />
  );

  const optionalNumField = (
    label: string,
    value: number | '',
    onChange: (v: number | '') => void,
    suffix: string,
  ) => (
    <NumberField
      label={`${label} (optional)`}
      value={value}
      allowEmpty
      size="small"
      onChange={onChange}
      slotProps={{
        input: {
          endAdornment: <InputAdornment position="end">{suffix}</InputAdornment>,
        },
        htmlInput: { min: 0, inputMode: 'decimal', step: 0.1 },
      }}
    />
  );

  return (
    <Dialog
      fullScreen={isMobile}
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: { display: 'flex', flexDirection: 'column' } },
        transition: { onExited: reset },
      }}
    >
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" color="secondary" onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>
            Add manually
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Enter values per 100g. We'll log {defaultServingG > 0 ? `${defaultServingG} g` : 'one serving'} to {MEAL_LABELS[mealType]}.
        </Typography>

        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        <TextField
          label="Brand (optional)"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />

        <NumberField
          label="Default serving"
          value={defaultServingG}
          onChange={setDefaultServingG}
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end">g</InputAdornment>,
            },
            htmlInput: { min: 0, inputMode: 'decimal' },
          }}
        />

        <Divider>Per 100g</Divider>

        <Stack direction="row" gap={1.5} flexWrap="wrap">
          <Box sx={{ flex: '1 1 120px' }}>
            {requiredNumField('Calories', calories, setCalories, 'kcal')}
          </Box>
          <Box sx={{ flex: '1 1 120px' }}>
            {requiredNumField('Protein', proteinG, setProteinG, 'g')}
          </Box>
          <Box sx={{ flex: '1 1 120px' }}>
            {requiredNumField('Carbs', carbsG, setCarbsG, 'g')}
          </Box>
          <Box sx={{ flex: '1 1 120px' }}>
            {requiredNumField('Fat', fatG, setFatG, 'g')}
          </Box>
        </Stack>

        <Stack direction="row" gap={1.5} flexWrap="wrap">
          <Box sx={{ flex: '1 1 120px' }}>
            {optionalNumField('Fiber', fiberG, setFiberG, 'g')}
          </Box>
          <Box sx={{ flex: '1 1 120px' }}>
            {optionalNumField('Sugar', sugarG, setSugarG, 'g')}
          </Box>
          <Box sx={{ flex: '1 1 120px' }}>
            {optionalNumField('Sodium', sodiumMg, setSodiumMg, 'mg')}
          </Box>
        </Stack>

        <Divider />

        <Button
          variant="contained"
          color="secondary"
          size="large"
          disabled={!canSubmit || busy}
          onClick={() => {
            void handleSave();
          }}
        >
          Save & log to {MEAL_LABELS[mealType]}
        </Button>
      </Box>
    </Dialog>
  );
};
