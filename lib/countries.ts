export interface Country {
  name: string;
  code: string;
  currency: string;
  currencySymbol: string;
  currencyName: string;
  flag: string;
}

export const countries: Country[] = [
  { name: 'United States', code: 'US', currency: 'USD', currencySymbol: '$', currencyName: 'US Dollar', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', currency: 'GBP', currencySymbol: '£', currencyName: 'British Pound', flag: '🇬🇧' },
  { name: 'Canada', code: 'CA', currency: 'CAD', currencySymbol: 'C$', currencyName: 'Canadian Dollar', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', currency: 'AUD', currencySymbol: 'A$', currencyName: 'Australian Dollar', flag: '🇦🇺' },
  { name: 'India', code: 'IN', currency: 'INR', currencySymbol: '₹', currencyName: 'Indian Rupee', flag: '🇮🇳' },
  { name: 'Singapore', code: 'SG', currency: 'SGD', currencySymbol: 'S$', currencyName: 'Singapore Dollar', flag: '🇸🇬' },
  { name: 'Japan', code: 'JP', currency: 'JPY', currencySymbol: '¥', currencyName: 'Japanese Yen', flag: '🇯🇵' },
  { name: 'China', code: 'CN', currency: 'CNY', currencySymbol: '¥', currencyName: 'Chinese Yuan', flag: '🇨🇳' },
  { name: 'Germany', code: 'DE', currency: 'EUR', currencySymbol: '€', currencyName: 'Euro', flag: '🇩🇪' },
  { name: 'France', code: 'FR', currency: 'EUR', currencySymbol: '€', currencyName: 'Euro', flag: '🇫🇷' },
  { name: 'Italy', code: 'IT', currency: 'EUR', currencySymbol: '€', currencyName: 'Euro', flag: '🇮🇹' },
  { name: 'Spain', code: 'ES', currency: 'EUR', currencySymbol: '€', currencyName: 'Euro', flag: '🇪🇸' },
  { name: 'Netherlands', code: 'NL', currency: 'EUR', currencySymbol: '€', currencyName: 'Euro', flag: '🇳🇱' },
  { name: 'Belgium', code: 'BE', currency: 'EUR', currencySymbol: '€', currencyName: 'Euro', flag: '🇧🇪' },
  { name: 'Switzerland', code: 'CH', currency: 'CHF', currencySymbol: 'Fr', currencyName: 'Swiss Franc', flag: '🇨🇭' },
  { name: 'Sweden', code: 'SE', currency: 'SEK', currencySymbol: 'kr', currencyName: 'Swedish Krona', flag: '🇸🇪' },
  { name: 'Norway', code: 'NO', currency: 'NOK', currencySymbol: 'kr', currencyName: 'Norwegian Krone', flag: '🇳🇴' },
  { name: 'Denmark', code: 'DK', currency: 'DKK', currencySymbol: 'kr', currencyName: 'Danish Krone', flag: '🇩🇰' },
  { name: 'Poland', code: 'PL', currency: 'PLN', currencySymbol: 'zł', currencyName: 'Polish Zloty', flag: '🇵🇱' },
  { name: 'Czech Republic', code: 'CZ', currency: 'CZK', currencySymbol: 'Kč', currencyName: 'Czech Koruna', flag: '🇨🇿' },
  { name: 'Brazil', code: 'BR', currency: 'BRL', currencySymbol: 'R$', currencyName: 'Brazilian Real', flag: '🇧🇷' },
  { name: 'Mexico', code: 'MX', currency: 'MXN', currencySymbol: '$', currencyName: 'Mexican Peso', flag: '🇲🇽' },
  { name: 'Argentina', code: 'AR', currency: 'ARS', currencySymbol: '$', currencyName: 'Argentine Peso', flag: '🇦🇷' },
  { name: 'South Africa', code: 'ZA', currency: 'ZAR', currencySymbol: 'R', currencyName: 'South African Rand', flag: '🇿🇦' },
  { name: 'UAE', code: 'AE', currency: 'AED', currencySymbol: 'د.إ', currencyName: 'UAE Dirham', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: 'SA', currency: 'SAR', currencySymbol: '﷼', currencyName: 'Saudi Riyal', flag: '🇸🇦' },
  { name: 'Turkey', code: 'TR', currency: 'TRY', currencySymbol: '₺', currencyName: 'Turkish Lira', flag: '🇹🇷' },
  { name: 'Russia', code: 'RU', currency: 'RUB', currencySymbol: '₽', currencyName: 'Russian Ruble', flag: '🇷🇺' },
  { name: 'South Korea', code: 'KR', currency: 'KRW', currencySymbol: '₩', currencyName: 'South Korean Won', flag: '🇰🇷' },
  { name: 'Hong Kong', code: 'HK', currency: 'HKD', currencySymbol: 'HK$', currencyName: 'Hong Kong Dollar', flag: '🇭🇰' },
  { name: 'Malaysia', code: 'MY', currency: 'MYR', currencySymbol: 'RM', currencyName: 'Malaysian Ringgit', flag: '🇲🇾' },
  { name: 'Thailand', code: 'TH', currency: 'THB', currencySymbol: '฿', currencyName: 'Thai Baht', flag: '🇹🇭' },
  { name: 'Indonesia', code: 'ID', currency: 'IDR', currencySymbol: 'Rp', currencyName: 'Indonesian Rupiah', flag: '🇮🇩' },
  { name: 'Philippines', code: 'PH', currency: 'PHP', currencySymbol: '₱', currencyName: 'Philippine Peso', flag: '🇵🇭' },
  { name: 'Vietnam', code: 'VN', currency: 'VND', currencySymbol: '₫', currencyName: 'Vietnamese Dong', flag: '🇻🇳' },
  { name: 'Pakistan', code: 'PK', currency: 'PKR', currencySymbol: '₨', currencyName: 'Pakistani Rupee', flag: '🇵🇰' },
  { name: 'Bangladesh', code: 'BD', currency: 'BDT', currencySymbol: '৳', currencyName: 'Bangladeshi Taka', flag: '🇧🇩' },
  { name: 'Egypt', code: 'EG', currency: 'EGP', currencySymbol: '£', currencyName: 'Egyptian Pound', flag: '🇪🇬' },
  { name: 'Nigeria', code: 'NG', currency: 'NGN', currencySymbol: '₦', currencyName: 'Nigerian Naira', flag: '🇳🇬' },
  { name: 'Kenya', code: 'KE', currency: 'KES', currencySymbol: 'KSh', currencyName: 'Kenyan Shilling', flag: '🇰🇪' },
  { name: 'New Zealand', code: 'NZ', currency: 'NZD', currencySymbol: 'NZ$', currencyName: 'New Zealand Dollar', flag: '🇳🇿' },
  { name: 'Israel', code: 'IL', currency: 'ILS', currencySymbol: '₪', currencyName: 'Israeli Shekel', flag: '🇮🇱' },
  { name: 'Ireland', code: 'IE', currency: 'EUR', currencySymbol: '€', currencyName: 'Euro', flag: '🇮🇪' },
  { name: 'Portugal', code: 'PT', currency: 'EUR', currencySymbol: '€', currencyName: 'Euro', flag: '🇵🇹' },
  { name: 'Austria', code: 'AT', currency: 'EUR', currencySymbol: '€', currencyName: 'Euro', flag: '🇦🇹' },
  { name: 'Greece', code: 'GR', currency: 'EUR', currencySymbol: '€', currencyName: 'Euro', flag: '🇬🇷' },
  { name: 'Finland', code: 'FI', currency: 'EUR', currencySymbol: '€', currencyName: 'Euro', flag: '🇫🇮' },
  { name: 'Chile', code: 'CL', currency: 'CLP', currencySymbol: '$', currencyName: 'Chilean Peso', flag: '🇨🇱' },
  { name: 'Colombia', code: 'CO', currency: 'COP', currencySymbol: '$', currencyName: 'Colombian Peso', flag: '🇨🇴' },
  { name: 'Peru', code: 'PE', currency: 'PEN', currencySymbol: 'S/', currencyName: 'Peruvian Sol', flag: '🇵🇪' },
];

export const getCurrencyForCountry = (countryCode: string): string => {
  const country = countries.find(c => c.code === countryCode);
  return country?.currency || 'USD';
};

export const getCurrencySymbol = (currencyCode: string): string => {
  const country = countries.find(c => c.currency === currencyCode);
  return country?.currencySymbol || '$';
};

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(c => c.code === code);
};

export const searchCountries = (searchTerm: string): Country[] => {
  const term = searchTerm.toLowerCase();
  return countries.filter(
    c =>
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      c.currency.toLowerCase().includes(term)
  );
};
