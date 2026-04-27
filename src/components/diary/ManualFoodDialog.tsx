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

  const numField = (
    label: string,
    value: number | '',
    onChange: (v: number) => void,
    suffix: string,
    optional = false,
  ) => (
    <TextField
      label={optional ? `${label} (optional)` : label}
      type="number"
      value={value}
      size="small"
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') {
          if (optional) onChange(NaN);
          else onChange(0);
        } else {
          onChange(Math.max(0, Number(raw)));
        }
      }}
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

        <TextField
          label="Default serving"
          type="number"
          value={defaultServingG}
          onChange={(e) => setDefaultServingG(Math.max(0, Number(e.target.value)))}
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
            {numField('Calories', calories, setCalories, 'kcal')}
          </Box>
          <Box sx={{ flex: '1 1 120px' }}>
            {numField('Protein', proteinG, setProteinG, 'g')}
          </Box>
          <Box sx={{ flex: '1 1 120px' }}>
            {numField('Carbs', carbsG, setCarbsG, 'g')}
          </Box>
          <Box sx={{ flex: '1 1 120px' }}>
            {numField('Fat', fatG, setFatG, 'g')}
          </Box>
        </Stack>

        <Stack direction="row" gap={1.5} flexWrap="wrap">
          <Box sx={{ flex: '1 1 120px' }}>
            {numField(
              'Fiber',
              fiberG,
              (v) => setFiberG(Number.isNaN(v) ? '' : v),
              'g',
              true,
            )}
          </Box>
          <Box sx={{ flex: '1 1 120px' }}>
            {numField(
              'Sugar',
              sugarG,
              (v) => setSugarG(Number.isNaN(v) ? '' : v),
              'g',
              true,
            )}
          </Box>
          <Box sx={{ flex: '1 1 120px' }}>
            {numField(
              'Sodium',
              sodiumMg,
              (v) => setSodiumMg(Number.isNaN(v) ? '' : v),
              'mg',
              true,
            )}
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
