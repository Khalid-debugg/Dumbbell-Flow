import { PAYMENT_METHODS } from './membership'
import { SupportedLanguage } from '../locales/i18n'

export interface Settings {
  id?: string

  language: SupportedLanguage
  currency: string

  gymName: string
  gymAddress?: string
  gymCountryCode?: string
  gymPhone?: string
  gymLogoPath?: string
  barcodeSize?: 'keychain' | 'card'

  allowedGenders: 'male' | 'female' | 'both'

  defaultPaymentMethod: (typeof PAYMENT_METHODS)[number]

  allowInstantCheckIn: boolean
  allowCustomMemberId: boolean

  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  backupFolderPath?: string
  lastBackupDate?: string

  cloudBackupEnabled: boolean
  cloudBackupApiUrl?: string
  lastCloudBackupDate?: string

  whatsappEnabled: boolean
  whatsappAutoSend: boolean
  whatsappDaysBeforeExpiry: number
  whatsappMessageTemplate: string
  whatsappLastCheckDate?: string

  createdAt?: string
  updatedAt?: string
}

export interface SettingsDbRow {
  id: '1'

  language: SupportedLanguage
  currency: string

  gym_name: string
  gym_address: string | null
  gym_country_code: string | null
  gym_phone: string | null
  gym_logo_path: string | null
  barcode_size: 'keychain' | 'card' | null

  allowed_genders: 'male' | 'female' | 'both'

  default_payment_method: (typeof PAYMENT_METHODS)[number]

  allow_instant_checkin: 0 | 1
  allow_custom_member_id: 0 | 1

  auto_backup: 0 | 1
  backup_frequency: 'daily' | 'weekly' | 'monthly'
  backup_folder_path: string | null
  last_backup_date: string | null

  cloud_backup_enabled: 0 | 1
  cloud_backup_api_url: string | null
  last_cloud_backup_date: string | null

  whatsapp_enabled: 0 | 1
  whatsapp_auto_send: 0 | 1
  whatsapp_days_before_expiry: number
  whatsapp_message_template: string
  whatsapp_last_check_date: string | null

  created_at: string
  updated_at: string
}

export const CURRENCIES = [
  // Major World Currencies
  { code: 'USD', name: 'US Dollar', arSymbol: '$', enSymbol: '$' },
  { code: 'EUR', name: 'Euro', arSymbol: '€', enSymbol: '€' },
  { code: 'GBP', name: 'British Pound', arSymbol: '£', enSymbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', arSymbol: '¥', enSymbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', arSymbol: 'CHF', enSymbol: 'CHF' },
  { code: 'CAD', name: 'Canadian Dollar', arSymbol: 'C$', enSymbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', arSymbol: 'A$', enSymbol: 'A$' },
  { code: 'CNY', name: 'Chinese Yuan', arSymbol: '¥', enSymbol: '¥' },

  // Middle East & North Africa
  { code: 'EGP', name: 'Egyptian Pound', arSymbol: 'ج.م', enSymbol: 'EGP' },
  { code: 'SAR', name: 'Saudi Riyal', arSymbol: 'ر.س', enSymbol: 'SAR' },
  { code: 'AED', name: 'UAE Dirham', arSymbol: 'د.إ', enSymbol: 'AED' },
  { code: 'KWD', name: 'Kuwaiti Dinar', arSymbol: 'د.ك', enSymbol: 'KWD' },
  { code: 'QAR', name: 'Qatari Riyal', arSymbol: 'ر.ق', enSymbol: 'QAR' },
  { code: 'BHD', name: 'Bahraini Dinar', arSymbol: 'د.ب', enSymbol: 'BHD' },
  { code: 'OMR', name: 'Omani Rial', arSymbol: 'ر.ع', enSymbol: 'OMR' },
  { code: 'JOD', name: 'Jordanian Dinar', arSymbol: 'د.ا', enSymbol: 'JOD' },
  { code: 'LBP', name: 'Lebanese Pound', arSymbol: 'ل.ل', enSymbol: 'LBP' },
  { code: 'ILS', name: 'Israeli Shekel', arSymbol: '₪', enSymbol: '₪' },
  { code: 'TND', name: 'Tunisian Dinar', arSymbol: 'د.ت', enSymbol: 'TND' },
  { code: 'MAD', name: 'Moroccan Dirham', arSymbol: 'د.م', enSymbol: 'MAD' },
  { code: 'DZD', name: 'Algerian Dinar', arSymbol: 'د.ج', enSymbol: 'DZD' },
  { code: 'IQD', name: 'Iraqi Dinar', arSymbol: 'د.ع', enSymbol: 'IQD' },
  { code: 'SYP', name: 'Syrian Pound', arSymbol: 'ل.س', enSymbol: 'SYP' },
  { code: 'YER', name: 'Yemeni Rial', arSymbol: 'ر.ي', enSymbol: 'YER' },
  { code: 'SDG', name: 'Sudanese Pound', arSymbol: 'ج.س', enSymbol: 'SDG' },
  { code: 'LYD', name: 'Libyan Dinar', arSymbol: 'د.ل', enSymbol: 'LYD' },
  { code: 'MRU', name: 'Mauritanian Ouguiya', arSymbol: 'أ.م', enSymbol: 'MRU' },

  // Europe
  { code: 'NOK', name: 'Norwegian Krone', arSymbol: 'kr', enSymbol: 'kr' },
  { code: 'SEK', name: 'Swedish Krona', arSymbol: 'kr', enSymbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', arSymbol: 'kr', enSymbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', arSymbol: 'zł', enSymbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', arSymbol: 'Kč', enSymbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', arSymbol: 'Ft', enSymbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', arSymbol: 'lei', enSymbol: 'lei' },
  { code: 'BGN', name: 'Bulgarian Lev', arSymbol: 'лв', enSymbol: 'лв' },
  { code: 'HRK', name: 'Croatian Kuna', arSymbol: 'kn', enSymbol: 'kn' },
  { code: 'RSD', name: 'Serbian Dinar', arSymbol: 'дин', enSymbol: 'дин' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', arSymbol: '₴', enSymbol: '₴' },
  { code: 'RUB', name: 'Russian Ruble', arSymbol: '₽', enSymbol: '₽' },
  { code: 'TRY', name: 'Turkish Lira', arSymbol: '₺', enSymbol: '₺' },
  { code: 'ISK', name: 'Icelandic Króna', arSymbol: 'kr', enSymbol: 'kr' },
  { code: 'ALL', name: 'Albanian Lek', arSymbol: 'L', enSymbol: 'L' },
  { code: 'BAM', name: 'Bosnia-Herzegovina Mark', arSymbol: 'KM', enSymbol: 'KM' },
  { code: 'MKD', name: 'Macedonian Denar', arSymbol: 'ден', enSymbol: 'ден' },

  // Asia
  { code: 'INR', name: 'Indian Rupee', arSymbol: '₹', enSymbol: '₹' },
  { code: 'PKR', name: 'Pakistani Rupee', arSymbol: '₨', enSymbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', arSymbol: '৳', enSymbol: '৳' },
  { code: 'LKR', name: 'Sri Lankan Rupee', arSymbol: 'Rs', enSymbol: 'Rs' },
  { code: 'NPR', name: 'Nepalese Rupee', arSymbol: 'Rs', enSymbol: 'Rs' },
  { code: 'AFN', name: 'Afghan Afghani', arSymbol: '؋', enSymbol: '؋' },
  { code: 'KRW', name: 'South Korean Won', arSymbol: '₩', enSymbol: '₩' },
  { code: 'TWD', name: 'Taiwan Dollar', arSymbol: 'NT$', enSymbol: 'NT$' },
  { code: 'HKD', name: 'Hong Kong Dollar', arSymbol: 'HK$', enSymbol: 'HK$' },
  { code: 'SGD', name: 'Singapore Dollar', arSymbol: 'S$', enSymbol: 'S$' },
  { code: 'MYR', name: 'Malaysian Ringgit', arSymbol: 'RM', enSymbol: 'RM' },
  { code: 'THB', name: 'Thai Baht', arSymbol: '฿', enSymbol: '฿' },
  { code: 'IDR', name: 'Indonesian Rupiah', arSymbol: 'Rp', enSymbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', arSymbol: '₱', enSymbol: '₱' },
  { code: 'VND', name: 'Vietnamese Dong', arSymbol: '₫', enSymbol: '₫' },
  { code: 'MMK', name: 'Myanmar Kyat', arSymbol: 'K', enSymbol: 'K' },
  { code: 'LAK', name: 'Laotian Kip', arSymbol: '₭', enSymbol: '₭' },
  { code: 'KHR', name: 'Cambodian Riel', arSymbol: '៛', enSymbol: '៛' },
  { code: 'BND', name: 'Brunei Dollar', arSymbol: 'B$', enSymbol: 'B$' },
  { code: 'MNT', name: 'Mongolian Tugrik', arSymbol: '₮', enSymbol: '₮' },
  { code: 'KZT', name: 'Kazakhstani Tenge', arSymbol: '₸', enSymbol: '₸' },
  { code: 'UZS', name: 'Uzbekistani Som', arSymbol: 'so\'m', enSymbol: 'so\'m' },
  { code: 'TJS', name: 'Tajikistani Somoni', arSymbol: 'SM', enSymbol: 'SM' },
  { code: 'TMT', name: 'Turkmenistani Manat', arSymbol: 'm', enSymbol: 'm' },
  { code: 'KGS', name: 'Kyrgyzstani Som', arSymbol: 'с', enSymbol: 'с' },
  { code: 'GEL', name: 'Georgian Lari', arSymbol: '₾', enSymbol: '₾' },
  { code: 'AMD', name: 'Armenian Dram', arSymbol: '֏', enSymbol: '֏' },
  { code: 'AZN', name: 'Azerbaijani Manat', arSymbol: '₼', enSymbol: '₼' },

  // Africa
  { code: 'ZAR', name: 'South African Rand', arSymbol: 'R', enSymbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', arSymbol: '₦', enSymbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', arSymbol: 'KSh', enSymbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', arSymbol: '₵', enSymbol: '₵' },
  { code: 'TZS', name: 'Tanzanian Shilling', arSymbol: 'TSh', enSymbol: 'TSh' },
  { code: 'UGX', name: 'Ugandan Shilling', arSymbol: 'USh', enSymbol: 'USh' },
  { code: 'ETB', name: 'Ethiopian Birr', arSymbol: 'Br', enSymbol: 'Br' },
  { code: 'XOF', name: 'West African CFA Franc', arSymbol: 'CFA', enSymbol: 'CFA' },
  { code: 'XAF', name: 'Central African CFA Franc', arSymbol: 'FCFA', enSymbol: 'FCFA' },
  { code: 'MAD', name: 'Moroccan Dirham', arSymbol: 'د.م', enSymbol: 'MAD' },
  { code: 'MUR', name: 'Mauritian Rupee', arSymbol: '₨', enSymbol: '₨' },
  { code: 'BWP', name: 'Botswanan Pula', arSymbol: 'P', enSymbol: 'P' },
  { code: 'ZMW', name: 'Zambian Kwacha', arSymbol: 'ZK', enSymbol: 'ZK' },
  { code: 'AOA', name: 'Angolan Kwanza', arSymbol: 'Kz', enSymbol: 'Kz' },
  { code: 'MZN', name: 'Mozambican Metical', arSymbol: 'MT', enSymbol: 'MT' },
  { code: 'NAD', name: 'Namibian Dollar', arSymbol: 'N$', enSymbol: 'N$' },
  { code: 'RWF', name: 'Rwandan Franc', arSymbol: 'FRw', enSymbol: 'FRw' },
  { code: 'MWK', name: 'Malawian Kwacha', arSymbol: 'MK', enSymbol: 'MK' },
  { code: 'SOS', name: 'Somali Shilling', arSymbol: 'Sh', enSymbol: 'Sh' },
  { code: 'DJF', name: 'Djiboutian Franc', arSymbol: 'Fdj', enSymbol: 'Fdj' },
  { code: 'ERN', name: 'Eritrean Nakfa', arSymbol: 'Nfk', enSymbol: 'Nfk' },

  // Americas
  { code: 'MXN', name: 'Mexican Peso', arSymbol: 'Mex$', enSymbol: 'Mex$' },
  { code: 'BRL', name: 'Brazilian Real', arSymbol: 'R$', enSymbol: 'R$' },
  { code: 'ARS', name: 'Argentine Peso', arSymbol: '$', enSymbol: '$' },
  { code: 'CLP', name: 'Chilean Peso', arSymbol: '$', enSymbol: '$' },
  { code: 'COP', name: 'Colombian Peso', arSymbol: '$', enSymbol: '$' },
  { code: 'PEN', name: 'Peruvian Sol', arSymbol: 'S/', enSymbol: 'S/' },
  { code: 'UYU', name: 'Uruguayan Peso', arSymbol: '$U', enSymbol: '$U' },
  { code: 'VES', name: 'Venezuelan Bolívar', arSymbol: 'Bs.', enSymbol: 'Bs.' },
  { code: 'BOB', name: 'Bolivian Boliviano', arSymbol: 'Bs', enSymbol: 'Bs' },
  { code: 'PYG', name: 'Paraguayan Guarani', arSymbol: '₲', enSymbol: '₲' },
  { code: 'CRC', name: 'Costa Rican Colón', arSymbol: '₡', enSymbol: '₡' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', arSymbol: 'Q', enSymbol: 'Q' },
  { code: 'HNL', name: 'Honduran Lempira', arSymbol: 'L', enSymbol: 'L' },
  { code: 'NIO', name: 'Nicaraguan Córdoba', arSymbol: 'C$', enSymbol: 'C$' },
  { code: 'PAB', name: 'Panamanian Balboa', arSymbol: 'B/.', enSymbol: 'B/.' },
  { code: 'DOP', name: 'Dominican Peso', arSymbol: 'RD$', enSymbol: 'RD$' },
  { code: 'JMD', name: 'Jamaican Dollar', arSymbol: 'J$', enSymbol: 'J$' },
  { code: 'TTD', name: 'Trinidad & Tobago Dollar', arSymbol: 'TT$', enSymbol: 'TT$' },
  { code: 'BBD', name: 'Barbadian Dollar', arSymbol: 'Bds$', enSymbol: 'Bds$' },
  { code: 'HTG', name: 'Haitian Gourde', arSymbol: 'G', enSymbol: 'G' },
  { code: 'XCD', name: 'East Caribbean Dollar', arSymbol: 'EC$', enSymbol: 'EC$' },

  // Oceania
  { code: 'NZD', name: 'New Zealand Dollar', arSymbol: 'NZ$', enSymbol: 'NZ$' },
  { code: 'FJD', name: 'Fijian Dollar', arSymbol: 'FJ$', enSymbol: 'FJ$' },
  { code: 'PGK', name: 'Papua New Guinean Kina', arSymbol: 'K', enSymbol: 'K' },
  { code: 'WST', name: 'Samoan Tala', arSymbol: 'WS$', enSymbol: 'WS$' },
  { code: 'TOP', name: 'Tongan Paʻanga', arSymbol: 'T$', enSymbol: 'T$' },
  { code: 'VUV', name: 'Vanuatu Vatu', arSymbol: 'VT', enSymbol: 'VT' },
  { code: 'SBD', name: 'Solomon Islands Dollar', arSymbol: 'SI$', enSymbol: 'SI$' }
]
export interface BackupFile {
  name: string
  path: string
  size: number
  created: string
}

export interface BackupInfo {
  lastBackup: string | null
  backupCount: number
  totalSize: number
  backups: BackupFile[]
  folderPath: string
}
