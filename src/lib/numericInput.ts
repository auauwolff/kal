export const stripLeadingZeros = (s: string): string =>
  /^0\d/.test(s) ? s.replace(/^0+/, '') : s;
