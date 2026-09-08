function normalizeSpaces(str: string): string {
  return str
    ? str
        .replace(/\s+/g, '')
        .replace(/\u200C/g, '')
        .trim()
    : '';
}

function normalizeArabicToPersian(str: string): string {
  const arabicToPersianMap: { [key: string]: string } = {
    ك: 'ک',
    ي: 'ی',
    ة: 'ه',
    ؤ: 'و',
    إ: 'ا',
    أ: 'ا',
    آ: 'آ',
    ى: 'ی',
    ئ: 'ی',
    ء: '',
    ۀ: 'ه',
    ۂ: 'ه',
    ۃ: 'ه',
    ٱ: 'ا',
    ٳ: 'ا',
    ٲ: 'ا',
    ٵ: 'ا',
    ﭐ: 'ا',
    ﭑ: 'ا',
    ﭒ: 'ب',
    ﭓ: 'پ',
    ﭔ: 'ت',
    ﭕ: 'ث',
    ﭖ: 'ج',
    ﭗ: 'چ',
    ﭘ: 'ح',
    ﭙ: 'خ',
    ﭚ: 'د',
    ﭛ: 'ذ',
    ﭜ: 'ر',
    ﭝ: 'ز',
    ﭞ: 'ژ',
    ﭟ: 'س',
    ﭠ: 'ش',
    ﭡ: 'ص',
    ﭢ: 'ض',
    ﭣ: 'ط',
    ﭤ: 'ظ',
    ﭥ: 'ع',
    ﭦ: 'غ',
    ﭧ: 'ف',
    ﭨ: 'ق',
    ﭩ: 'ک',
    ﭪ: 'گ',
    ﭫ: 'ل',
    ﭬ: 'م',
    ﭭ: 'ن',
    ﭮ: 'و',
    ﭯ: 'ه',
    ﭰ: 'ی',
  };

  return str
    .split('')
    .map((char) => arabicToPersianMap[char] || char)
    .join('');
}

export function comparePersianStrings(str1: string, str2: string): boolean {
  const normalizedStr1 = normalizeArabicToPersian(normalizeSpaces(str1));
  const normalizedStr2 = normalizeArabicToPersian(normalizeSpaces(str2));

  return normalizedStr1 === normalizedStr2;
}
