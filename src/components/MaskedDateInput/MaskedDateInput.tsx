'use client';

import React, { useCallback, useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const PH = ['д', 'д', 'м', 'м', 'г', 'г', 'г', 'г'];

function toDigits(val: string): string {
  if (!val) return '';
  // YYYY-MM-DD → DDMMYYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, d] = val.split('-');
    return d + m + y;
  }
  // DD.MM.YYYY → DDMMYYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(val)) {
    return val.replace(/\./g, '');
  }
  return val.replace(/\D/g, '').slice(0, 8);
}

function formatDisplay(digits: string): string {
  const c = (i: number) => digits[i] ?? PH[i];
  return `${c(0)}${c(1)}.${c(2)}${c(3)}.${c(4)}${c(5)}${c(6)}${c(7)}`;
}

function toEmit(digits: string): string {
  if (digits.length === 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`;
  }
  return digits;
}

const MaskedDateInput: React.FC<Props> = ({ value, onChange, className }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const digitsRef = useRef(toDigits(value));

  const apply = useCallback((d: string) => {
    digitsRef.current = d;
    if (inputRef.current) inputRef.current.value = formatDisplay(d);
    onChange(toEmit(d));
  }, [onChange]);

  useEffect(() => {
    const d = toDigits(value);
    if (d !== digitsRef.current) {
      digitsRef.current = d;
      if (inputRef.current) inputRef.current.value = formatDisplay(d);
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      apply(digitsRef.current.slice(0, -1));
    } else if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      if (digitsRef.current.length < 8) apply(digitsRef.current + e.key);
    } else if (e.key !== 'Tab' && e.key !== 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const ev = e.nativeEvent as InputEvent;
    const d = digitsRef.current;
    if (ev.inputType === 'deleteContentBackward' || ev.inputType === 'deleteContentForward') {
      apply(d.slice(0, -1));
    } else if (ev.data && /^\d$/.test(ev.data)) {
      if (d.length < 8) apply(d + ev.data);
      else if (inputRef.current) inputRef.current.value = formatDisplay(d);
    } else {
      if (inputRef.current) inputRef.current.value = formatDisplay(d);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      className={className}
      defaultValue={formatDisplay(digitsRef.current)}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
    />
  );
};

export default MaskedDateInput;
