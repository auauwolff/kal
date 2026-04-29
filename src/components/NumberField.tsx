import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { TextField, type TextFieldProps } from '@mui/material';
import { stripLeadingZeros } from '@/lib/numericInput';

type BaseProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type'> & {
  min?: number;
};

type RequiredProps = BaseProps & {
  value: number;
  onChange: (value: number) => void;
  allowEmpty?: false;
};

type OptionalProps = BaseProps & {
  value: number | '';
  onChange: (value: number | '') => void;
  allowEmpty: true;
};

export type NumberFieldProps = RequiredProps | OptionalProps;

const toText = (v: number | ''): string => (v === '' ? '' : String(v));

export const NumberField = (props: NumberFieldProps) => {
  const { value, onChange, min = 0, allowEmpty = false, ...rest } = props;

  const [text, setText] = useState(() => toText(value));
  const lastEmitted = useRef<number | ''>(value);

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setText(toText(value));
      lastEmitted.current = value;
    }
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const cleaned = stripLeadingZeros(e.target.value);
    setText(cleaned);

    let next: number | '';
    if (cleaned === '' || cleaned === '.') {
      next = allowEmpty ? '' : 0;
    } else {
      const num = Number(cleaned);
      if (Number.isNaN(num)) return;
      next = Math.max(min, num);
    }
    lastEmitted.current = next;
    (onChange as (v: number | '') => void)(next);
  };

  return <TextField {...rest} type="number" value={text} onChange={handleChange} />;
};
