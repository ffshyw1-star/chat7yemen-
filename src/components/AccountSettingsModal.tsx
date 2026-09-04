import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Gender, PrivatePrivacySetting, ThemeMode } from '../types';
import { UserAvatar } from './UserAvatar';
import { UsernameDisplay } from './UsernameDisplay';
import { DEFAULT_AVATARS, NEON_COLORS, USERNAME_FONT_SIZES } from './ProfileEditorModal';
import { playChatSound } from '../utils/audio';
import { COUNTRIES_LIST, getCountryFlagByName, getArabicCountryName, getEnglishCountryName } from '../utils/geoip';
import { formatEnglishDate } from '../utils/dateUtils';
import { applyLanguageSettings, getAppLanguage, t } from '../utils/translations';
import { RANK_TITLES } from '../utils/permissions';
import {
  X, User, Shield, Volume2, Globe, Lock, Trash2, Check,
  Palette, Edit3, VolumeX, Camera, Upload, Link, RefreshCw, Volume1,
  UserCheck, HelpCircle, Brush, UserPlus, Ban, Monitor, MessageSquare,
  Mail, Key, ArrowRight, ShieldCheck, Save, ChevronDown, Search
} from 'lucide-react';

// All World Languages in English sorted alphabetically
const WORLD_LANGUAGES = [
  'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Azerbaijani', 'Basque',
  'Belarusian', 'Bengali', 'Bosnian', 'Bulgarian', 'Catalan', 'Chinese (Mandarin)',
  'Chinese (Cantonese)', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Estonian',
  'Finnish', 'French', 'Galician', 'Georgian', 'German', 'Greek', 'Gujarati', 'Hebrew',
  'Hindi', 'Hungarian', 'Icelandic', 'Indonesian', 'Irish', 'Italian', 'Japanese',
  'Javanese', 'Kannada', 'Kazakh', 'Khmer', 'Korean', 'Kurdish', 'Lao', 'Latin',
  'Latvian', 'Lithuanian', 'Macedonian', 'Malay', 'Malayalam', 'Marathi', 'Mongolian',
  'Nepali', 'Norwegian', 'Pashto', 'Persian (Farsi)', 'Polish', 'Portuguese', 'Punjabi',
  'Romanian', 'Russian', 'Serbian', 'Sinhala', 'Slovak', 'Slovenian', 'Somali', 'Spanish',
  'Swahili', 'Swedish', 'Tagalog (Filipino)', 'Tamil', 'Telugu', 'Thai', 'Turkish',
  'Turkmen', 'Ukrainian', 'Urdu', 'Uzbek', 'Vietnamese', 'Welsh', 'Yiddish', 'Zulu'
];

// All World Countries in English sorted alphabetically
const WORLD_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia',
  'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
  'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina',
  'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia',
  'Cameroon', 'Canada', 'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia', 'Cuba',
  'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominican Republic', 'Ecuador',
  'Egypt', 'El Salvador', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Guinea', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali',
  'Malta', 'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia',
  'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'Norway', 'Oman',
  'Pakistan', 'Palestine', 'Panama', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'Somalia', 'South Africa', 'South Korea',
  'Spain', 'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Tunisia', 'Turkey', 'Turkmenistan', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const POPUP_LANGUAGES = [
  'Arabic', 'Bulgarian', 'Croatia', 'English', 'Francais', 'German', 'Greek',
  'Hebrew', 'Netherlands', 'Portuguese', 'Romana', 'Russian', 'Spanish', 'Turkish'
];

const POPUP_COUNTRIES = [
  'عدم إظهار',
  'Afghanistan', 'Albania', 'Algeria', 'American Samoa', 'Andorra', 'Angola', 'Anguilla',
  'Antigua and Barbuda', 'Argentina', 'Armenia', 'Aruba', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bermuda', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
  'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
  'Canada', 'Cape Verde', 'Cayman Islands', 'Central African Republic', 'Chad', 'Chile',
  'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece',
  'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
  'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
  'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
  'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macao', 'Macedonia', 'Madagascar',
  'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
  'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
  'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'Norway', 'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Palestinian Territories', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore',
  'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Swaziland', 'Sweden',
  'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste',
  'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia',
  'Zimbabwe'
];

const POPUP_TIMEZONES = [
  'Asia/Aden', 'Asia/Almaty', 'Asia/Amman', 'Asia/Anadyr', 'Asia/Aqtau', 'Asia/Aqtobe',
  'Asia/Ashgabat', 'Asia/Ashkhabad', 'Asia/Baghdad', 'Asia/Bahrain', 'Asia/Baku',
  'Asia/Bangkok', 'Asia/Beirut', 'Asia/Bishkek', 'Asia/Brunei', 'Asia/Calcutta',
  'Asia/Choibalsan', 'Asia/Colombo', 'Asia/Damascus', 'Asia/Dhaka', 'Asia/Dili',
  'Asia/Dubai', 'Asia/Dushanbe', 'Asia/Gaza', 'Asia/Hong_Kong', 'Asia/Hovd',
  'Asia/Irkutsk', 'Asia/Jakarta', 'Asia/Jayapura', 'Asia/Jerusalem', 'Asia/Kabul',
  'Asia/Kamchatka', 'Asia/Karachi', 'Asia/Kashgar', 'Asia/Katmandu', 'Asia/Krasnoyarsk',
  'Asia/Kuala_Lumpur', 'Asia/Kuching', 'Asia/Kuwait', 'Asia/Macau', 'Asia/Magadan',
  'Asia/Makassar', 'Asia/Manila', 'Asia/Muscat', 'Asia/Nicosia', 'Asia/Novokuznetsk',
  'Asia/Novosibirsk', 'Asia/Omsk', 'Asia/Oral', 'Asia/Phnom_Penh', 'Asia/Pontianak',
  'Asia/Pyongyang', 'Asia/Qatar', 'Asia/Qyzylorda', 'Asia/Riyadh', 'Asia/Sakhalin',
  'Asia/Samarkand', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore',
  'Asia/Srednekolymsk', 'Asia/Taipei', 'Asia/Tashkent', 'Asia/Tbilisi', 'Asia/Tehran',
  'Asia/Thimphu', 'Asia/Tokyo', 'Asia/Tomsk', 'Asia/Ulaanbaatar', 'Asia/Urumqi',
  'Asia/Vientiane', 'Asia/Vladivostok', 'Asia/Yakutsk', 'Asia/Yangon',
  'Asia/Yekaterinburg', 'Asia/Yerevan',
  'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers',
  'Africa/Asmara', 'Africa/Bamako', 'Africa/Bangui', 'Africa/Banjul', 'Africa/Bissau',
  'Africa/Blantyre', 'Africa/Brazzaville', 'Africa/Bujumbura', 'Africa/Cairo',
  'Africa/Casablanca', 'Africa/Ceuta', 'Africa/Conakry', 'Africa/Dakar',
  'Africa/Dar_es_Salaam', 'Africa/Djibouti', 'Africa/Douala', 'Africa/El_Aaiun',
  'Africa/Freetown', 'Africa/Gaborone', 'Africa/Harare', 'Africa/Johannesburg',
  'Africa/Juba', 'Africa/Kampala', 'Africa/Khartoum', 'Africa/Kigali', 'Africa/Kinshasa',
  'Africa/Lagos', 'Africa/Libreville', 'Africa/Lome', 'Africa/Luanda', 'Africa/Lubumbashi',
  'Africa/Lusaka', 'Africa/Malabo', 'Africa/Maputo', 'Africa/Maseru', 'Africa/Mbabane',
  'Africa/Mogadishu', 'Africa/Monrovia', 'Africa/Nairobi', 'Africa/Ndjamena',
  'Africa/Niamey', 'Africa/Nouakchott', 'Africa/Ouagadougou', 'Africa/Porto-Novo',
  'Africa/Sao_Tome', 'Africa/Tripoli', 'Africa/Tunis', 'Africa/Windhoek',
  'Europe/Amsterdam', 'Europe/Andorra', 'Europe/Athens', 'Europe/Belgrade',
  'Europe/Berlin', 'Europe/Bratislava', 'Europe/Brussels', 'Europe/Bucharest',
  'Europe/Budapest', 'Europe/Chisinau', 'Europe/Copenhagen', 'Europe/Dublin',
  'Europe/Helsinki', 'Europe/Istanbul', 'Europe/Kaliningrad', 'Europe/Kiev',
  'Europe/Lisbon', 'Europe/Ljubljana', 'Europe/London', 'Europe/Luxembourg',
  'Europe/Madrid', 'Europe/Malta', 'Europe/Minsk', 'Europe/Monaco', 'Europe/Moscow',
  'Europe/Oslo', 'Europe/Paris', 'Europe/Prague', 'Europe/Riga', 'Europe/Rome',
  'Europe/Samara', 'Europe/San_Marino', 'Europe/Sarajevo', 'Europe/Skopje',
  'Europe/Sofia', 'Europe/Stockholm', 'Europe/Tallinn', 'Europe/Tirane',
  'Europe/Uzhgorod', 'Europe/Vaduz', 'Europe/Vatican', 'Europe/Vienna',
  'Europe/Vilnius', 'Europe/Volgograd', 'Europe/Warsaw', 'Europe/Zagreb',
  'Europe/Zaporozhye', 'Europe/Zurich',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Sao_Paulo', 'America/Buenos_Aires', 'America/Mexico_City',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Pacific/Auckland',
  'Pacific/Honolulu'
];

interface CapitalItem {
  capital: string;
  country: string;
  timeZone: string;
}

interface ContinentGroup {
  continent: string;
  capitals: CapitalItem[];
}

const CONTINENTS_AND_CAPITALS: ContinentGroup[] = [
  {
    continent: 'Asia',
    capitals: [
      { capital: "Sana'a", country: 'Yemen', timeZone: 'Asia/Aden' },
      { capital: 'Riyadh', country: 'Saudi Arabia', timeZone: 'Asia/Riyadh' },
      { capital: 'Abu Dhabi', country: 'United Arab Emirates', timeZone: 'Asia/Dubai' },
      { capital: 'Doha', country: 'Qatar', timeZone: 'Asia/Qatar' },
      { capital: 'Kuwait City', country: 'Kuwait', timeZone: 'Asia/Kuwait' },
      { capital: 'Manama', country: 'Bahrain', timeZone: 'Asia/Bahrain' },
      { capital: 'Muscat', country: 'Oman', timeZone: 'Asia/Muscat' },
      { capital: 'Amman', country: 'Jordan', timeZone: 'Asia/Amman' },
      { capital: 'Damascus', country: 'Syria', timeZone: 'Asia/Damascus' },
      { capital: 'Baghdad', country: 'Iraq', timeZone: 'Asia/Baghdad' },
      { capital: 'Jerusalem', country: 'Palestine', timeZone: 'Asia/Gaza' },
      { capital: 'Beirut', country: 'Lebanon', timeZone: 'Asia/Beirut' },
      { capital: 'Tokyo', country: 'Japan', timeZone: 'Asia/Tokyo' },
      { capital: 'Beijing', country: 'China', timeZone: 'Asia/Shanghai' },
      { capital: 'New Delhi', country: 'India', timeZone: 'Asia/Kolkata' },
      { capital: 'Jakarta', country: 'Indonesia', timeZone: 'Asia/Jakarta' },
      { capital: 'Bangkok', country: 'Thailand', timeZone: 'Asia/Bangkok' },
      { capital: 'Seoul', country: 'South Korea', timeZone: 'Asia/Seoul' },
      { capital: 'Kuala Lumpur', country: 'Malaysia', timeZone: 'Asia/Kuala_Lumpur' },
      { capital: 'Singapore', country: 'Singapore', timeZone: 'Asia/Singapore' },
      { capital: 'Tashkent', country: 'Uzbekistan', timeZone: 'Asia/Tashkent' },
      { capital: 'Astana', country: 'Kazakhstan', timeZone: 'Asia/Almaty' },
      { capital: 'Baku', country: 'Azerbaijan', timeZone: 'Asia/Baku' },
      { capital: 'Tehran', country: 'Iran', timeZone: 'Asia/Tehran' },
      { capital: 'Islamabad', country: 'Pakistan', timeZone: 'Asia/Karachi' },
      { capital: 'Kabul', country: 'Afghanistan', timeZone: 'Asia/Kabul' },
      { capital: 'Dhaka', country: 'Bangladesh', timeZone: 'Asia/Dhaka' },
      { capital: 'Ankara', country: 'Turkey', timeZone: 'Europe/Istanbul' }
    ]
  },
  {
    continent: 'Africa',
    capitals: [
      { capital: 'Cairo', country: 'Egypt', timeZone: 'Africa/Cairo' },
      { capital: 'Khartoum', country: 'Sudan', timeZone: 'Africa/Khartoum' },
      { capital: 'Tripoli', country: 'Libya', timeZone: 'Africa/Tripoli' },
      { capital: 'Tunis', country: 'Tunisia', timeZone: 'Africa/Tunis' },
      { capital: 'Algiers', country: 'Algeria', timeZone: 'Africa/Algiers' },
      { capital: 'Rabat', country: 'Morocco', timeZone: 'Africa/Casablanca' },
      { capital: 'Mogadishu', country: 'Somalia', timeZone: 'Africa/Mogadishu' },
      { capital: 'Djibouti', country: 'Djibouti', timeZone: 'Africa/Djibouti' },
      { capital: 'Addis Ababa', country: 'Ethiopia', timeZone: 'Africa/Addis_Ababa' },
      { capital: 'Nairobi', country: 'Kenya', timeZone: 'Africa/Nairobi' },
      { capital: 'Abuja', country: 'Nigeria', timeZone: 'Africa/Lagos' },
      { capital: 'Pretoria', country: 'South Africa', timeZone: 'Africa/Johannesburg' },
      { capital: 'Accra', country: 'Ghana', timeZone: 'Africa/Accra' },
      { capital: 'Dakar', country: 'Senegal', timeZone: 'Africa/Dakar' }
    ]
  },
  {
    continent: 'Europe',
    capitals: [
      { capital: 'London', country: 'United Kingdom', timeZone: 'Europe/London' },
      { capital: 'Paris', country: 'France', timeZone: 'Europe/Paris' },
      { capital: 'Berlin', country: 'Germany', timeZone: 'Europe/Berlin' },
      { capital: 'Rome', country: 'Italy', timeZone: 'Europe/Rome' },
      { capital: 'Madrid', country: 'Spain', timeZone: 'Europe/Madrid' },
      { capital: 'Moscow', country: 'Russia', timeZone: 'Europe/Moscow' },
      { capital: 'Amsterdam', country: 'Netherlands', timeZone: 'Europe/Amsterdam' },
      { capital: 'Brussels', country: 'Belgium', timeZone: 'Europe/Brussels' },
      { capital: 'Vienna', country: 'Austria', timeZone: 'Europe/Vienna' },
      { capital: 'Bern', country: 'Switzerland', timeZone: 'Europe/Zurich' },
      { capital: 'Athens', country: 'Greece', timeZone: 'Europe/Athens' },
      { capital: 'Stockholm', country: 'Sweden', timeZone: 'Europe/Stockholm' },
      { capital: 'Oslo', country: 'Norway', timeZone: 'Europe/Oslo' },
      { capital: 'Copenhagen', country: 'Denmark', timeZone: 'Europe/Copenhagen' },
      { capital: 'Dublin', country: 'Ireland', timeZone: 'Europe/Dublin' },
      { capital: 'Warsaw', country: 'Poland', timeZone: 'Europe/Warsaw' },
      { capital: 'Kyiv', country: 'Ukraine', timeZone: 'Europe/Kyiv' }
    ]
  },
  {
    continent: 'North America',
    capitals: [
      { capital: 'Washington, D.C.', country: 'United States', timeZone: 'America/New_York' },
      { capital: 'Ottawa', country: 'Canada', timeZone: 'America/Toronto' },
      { capital: 'Mexico City', country: 'Mexico', timeZone: 'America/Mexico_City' },
      { capital: 'Havana', country: 'Cuba', timeZone: 'America/Havana' },
      { capital: 'San Jose', country: 'Costa Rica', timeZone: 'America/Costa_Rica' }
    ]
  },
  {
    continent: 'South America',
    capitals: [
      { capital: 'Brasilia', country: 'Brazil', timeZone: 'America/Sao_Paulo' },
      { capital: 'Buenos Aires', country: 'Argentina', timeZone: 'America/Argentina/Buenos_Aires' },
      { capital: 'Bogota', country: 'Colombia', timeZone: 'America/Bogota' },
      { capital: 'Santiago', country: 'Chile', timeZone: 'America/Santiago' },
      { capital: 'Lima', country: 'Peru', timeZone: 'America/Lima' },
      { capital: 'Caracas', country: 'Venezuela', timeZone: 'America/Caracas' }
    ]
  },
  {
    continent: 'Oceania',
    capitals: [
      { capital: 'Canberra', country: 'Australia', timeZone: 'Australia/Sydney' },
      { capital: 'Wellington', country: 'New Zealand', timeZone: 'Pacific/Auckland' },
      { capital: 'Suva', country: 'Fiji', timeZone: 'Pacific/Fiji' }
    ]
  }
];

const SOLID_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b',
  '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a',
  '#059669', '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#4f46e5',
  '#7c3aed', '#9333ea', '#c026d3', '#db2777', '#e11d48', '#475569'
];

const NEON_SWATCHES = [
  '#ff0055', '#ff5500', '#ffaa00', '#ffff00', '#aaff00', '#55ff00',
  '#00ff55', '#00ffaa', '#00ffff', '#00aaff', '#0055ff', '#5500ff',
  '#aa00ff', '#ff00ff', '#ff00aa', '#00ffcc', '#ff3366', '#33ffcc',
  '#ff1493', '#00bfff', '#7fffd4', '#ff4500', '#da70d6', '#ee82ee',
  '#ff69b4', '#00e5ff', '#76ff03', '#ffd600', '#ff3d00', '#d500f9',
  '#651fff', '#2979ff', '#00e676', '#ffea00', '#ff9100', '#ff1744'
];

const GRADIENT_SWATCHES = [
  // Glittering Golds & Metallics
  'linear-gradient(135deg, #ffd700 0%, #fff8dc 25%, #ffb700 50%, #fff2a3 75%, #d4af37 100%)', // Gold Sparkle
  'linear-gradient(135deg, #e6c875 0%, #ffd700 30%, #ffae19 60%, #fff3b0 100%)', // Imperial Gold
  'linear-gradient(135deg, #e0e0e0 0%, #ffffff 35%, #9e9e9e 70%, #f5f5f5 100%)', // Platinum Chrome
  'linear-gradient(135deg, #f3a683 0%, #f7d794 50%, #f8a5c2 100%)', // Rose Gold Shimmer

  // Radiant Gems & Jewels
  'linear-gradient(135deg, #ff0844 0%, #ffb199 50%, #e50914 100%)', // Ruby Fire
  'linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #00c6ff 100%)', // Diamond Sapphire
  'linear-gradient(135deg, #0ba360 0%, #3cba92 50%, #30dd8a 100%)', // Emerald Glow
  'linear-gradient(135deg, #b92b27 0%, #1565c0 100%)', // Royal Velvet
  'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)', // Radiant Coral
  'linear-gradient(135deg, #8a2387 0%, #e94057 50%, #f27121 100%)', // Sunset Flare

  // Neon & Cyber Glowing
  'linear-gradient(135deg, #ff007f 0%, #7f00ff 50%, #00ffff 100%)', // Cyber Laser
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // Cosmic Violet
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', // Neon Mint
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Sweet Pink Glow
  'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)', // Deep Indigo
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Orchid Shine

  // Holographic & Aurora
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Mystic Teal
  'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)', // Fairy Dust
  'linear-gradient(135deg, #ff4e50 0%, #f9d423 100%)', // Solar Flash
  'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', // Ocean Electric
  'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', // Volcano Flame
  'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)', // Prismatic Rainbow
  'linear-gradient(135deg, #fe8c00 0%, #f83600 100%)', // Neon Orange
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', // Deep Space
  'linear-gradient(135deg, #ed213a 0%, #93291e 100%)', // Blood Diamond
  'linear-gradient(135deg, #4568dc 0%, #b06ab3 100%)', // Velvet Purple
  'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)', // Cyan Ice
  'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)', // Glacier Sparkle
  'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)', // Sky Blue Glow
  'linear-gradient(135deg, #cc2b5e 0%, #753a88 100%)', // Purple Velvet
  'linear-gradient(135deg, #40e0d0 0%, #ff8c00 50%, #ff0080 100%)', // Exotic Prism
  'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)', // Slate Topaz
  'linear-gradient(135deg, #c31432 0%, #240b36 100%)', // Dark Nebula
  'linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)', // Celestial Dawn
  'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)', // Tropical Sunset
  'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)' // Aqua Jewel
];

const FONTS_LIST = [
  { name: 'Normal', family: 'Cairo, sans-serif' },
  { name: 'Kalam', family: "'Kalam', cursive" },
  { name: 'Signika', family: "'Signika', sans-serif" },
  { name: 'Grandmaster', family: "'Cairo', sans-serif" },
  { name: 'Comic neue', family: "'Comic Neue', cursive" },
  { name: 'Quicksand', family: "'Quicksand', sans-serif" },
  { name: 'Orbitron', family: "'Orbitron', sans-serif" },
  { name: 'Lemonada', family: "'Lemonada', cursive" },
  { name: 'Grenze Gotisch', family: "'Grenze Gotisch', serif" },
  { name: 'Merienda', family: "'Merienda', cursive" },
  { name: 'Amita', family: "'Amita', cursive" },
  { name: 'Averia Libre', family: "'Averia Libre', cursive" },
  { name: 'Turret Road', family: "'Turret Road', cursive" },
  { name: 'Sansita', family: "'Sansita', sans-serif" },
  { name: 'Comfortaa', family: "'Comfortaa', cursive" },
  { name: 'Charm', family: "'Charm', cursive" },
  { name: 'Lobster Two', family: "'Lobster Two', cursive" }
];

export const AccountSettingsModal: React.FC = () => {
  const {
    currentUser, updateUserProfile, audioSettings, updateAudioSettings,
    setIsProfileSettingsOpen, removeFriend, users, themeMode, setThemeMode,
    toggleIgnore, toggleBlockUser, requestBlockConfirm, showTopBanner,
    currentUserCan
  } = useChat();

  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

  // Form states
  const [age, setAge] = useState<number | string>(currentUser?.age !== undefined ? currentUser.age : 'عدم الإظهار');
  const [gender, setGender] = useState<Gender>(currentUser?.gender || 'male');
  const [country, setCountry] = useState(currentUser?.country || 'اليمن');
  const [hideCountry, setHideCountry] = useState<boolean>(currentUser?.hideCountry || false);
  const [statusMessage, setStatusMessage] = useState(currentUser?.statusMessage || 'كن أقوى من أعذارك.');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || 'user@arabsyemen.com');
  const [usernameColor, setUsernameColor] = useState(currentUser?.usernameColor || '#000000');
  const [usernameFontSize, setUsernameFontSize] = useState(currentUser?.usernameFontSize || '14px');
  const [fontFamily, setFontFamily] = useState<string>(currentUser?.fontFamily || 'Grenze Gotisch');
  const [usernameBgGradient, setUsernameBgGradient] = useState<string>(currentUser?.usernameBgGradient || '');
  const [isNeon, setIsNeon] = useState<boolean>(currentUser?.isNeon || false);
  const [colorTab, setColorTab] = useState<'color' | 'neon' | 'bg'>('color');
  const [openFontPickerModal, setOpenFontPickerModal] = useState<boolean>(false);
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [wallCover, setWallCover] = useState(
    currentUser?.wallCover || 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=800&auto=format&fit=crop&q=80'
  );

  // Sub-tabs & Popups for Language / Location sub-menu
  const [selectedLang, setSelectedLang] = useState<string>(() => localStorage.getItem('selectedLang') || 'Arabic');
  const [selectedCountryLoc, setSelectedCountryLoc] = useState<string>(() => {
    if (currentUser?.hideCountry || currentUser?.country === 'عدم إظهار') return 'عدم إظهار';
    return getEnglishCountryName(currentUser?.country) || 'Yemen';
  });
  const [selectedTimezoneLoc, setSelectedTimezoneLoc] = useState<string>(() => localStorage.getItem('selectedTimezone') || 'Asia/Aden');
  const [openLocPickerModal, setOpenLocPickerModal] = useState<'lang' | 'country' | 'timezone' | null>(null);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');

  const [privatePrivacy, setPrivatePrivacy] = useState<PrivatePrivacySetting>(currentUser?.privatePrivacy || 'everyone');
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(themeMode);
  const [isThemeSelectModalOpen, setIsThemeSelectModalOpen] = useState(false);

  const THEME_OPTIONS: { id: ThemeMode; name: string }[] = [
    { id: 'default', name: 'الثيم الافتراضي' },
    { id: 'dark', name: 'Dark' },
    { id: 'gray', name: 'Gray' },
    { id: 'lite', name: 'Lite' },
  ];

  useEffect(() => {
    if (currentUser?.privatePrivacy) {
      setPrivatePrivacy(currentUser.privatePrivacy);
    }
  }, [currentUser?.privatePrivacy]);

  useEffect(() => {
    if (currentUser?.hideCountry || currentUser?.country === 'عدم إظهار') {
      setSelectedCountryLoc('عدم إظهار');
    } else if (currentUser?.country) {
      setSelectedCountryLoc(getEnglishCountryName(currentUser.country));
    }
  }, [currentUser?.country, currentUser?.hideCountry]);

  // Avatar Selection State
  const [avatarCategory, setAvatarCategory] = useState<'men' | 'women' | 'royal' | 'cute'>('men');

  // Security fields
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Refs for hidden file inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const friendUsers = users.filter(u => currentUser.friends?.includes(u.id));
  const ignoredUsersList = users.filter(u => currentUser.blockedUsers?.includes(u.id) || currentUser.ignores?.includes(u.id));
  const ageOptions = Array.from({ length: 84 }, (_, i) => i + 16);
  const filteredAvatars = DEFAULT_AVATARS.filter(a => a.category === avatarCategory);

  const canChangeAvatar = ['vip', 'moderator', 'management', 'admin', 'owner'].includes(currentUser.role);

  const triggerSaveNotification = () => {
    setSaveSuccess('تم الحفظ');
    showTopBanner('تم الحفظ');
    setActiveSubMenu(null);
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  // File upload handlers
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً! يُرجى اختيار صورة أقل من 5 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setWallCover(reader.result);
          updateUserProfile({ wallCover: reader.result });
          triggerSaveNotification();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canChangeAvatar) {
      alert('🔒 الصورة الشخصية ثابتة للعضو المسجل. ستتمكن من تغيير ورفع صورتك المخصصة عند ترقية حسابك إلى رتبة مميز ⭐ فما فوق.');
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً! يُرجى اختيار صورة أقل من 5 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
          updateUserProfile({ avatar: reader.result });
          triggerSaveNotification();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCover = () => {
    const defaultCover = 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=800&auto=format&fit=crop&q=80';
    setWallCover(defaultCover);
    updateUserProfile({ wallCover: defaultCover });
    triggerSaveNotification();
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    updateUserProfile({ avatar: '' });
    triggerSaveNotification();
  };

  const handleSaveData = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateUserProfile({
      age,
      gender,
      country,
      hideCountry,
      statusMessage: statusMessage.trim(),
      bio: bio.trim(),
      avatar,
      wallCover,
      username: username.trim() || currentUser.username,
      email: email.trim(),
      usernameColor,
      usernameBgGradient,
      fontFamily,
      isNeon,
      usernameFontSize
    });
    triggerSaveNotification();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      alert('كلمة المرور الجديدة غير متطابقة مع التأكيد');
      return;
    }
    updateUserProfile({ password: newPass });
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
    triggerSaveNotification();
  };

  const handleDeleteAccount = () => {
    if (confirm('هل أنت تأكد من جدولة حذف عضوية الشات؟ سيتم حذف حسابك نهائياً بعد أسبوع.')) {
      updateUserProfile({ deletionScheduledDate: new Date(Date.now() + 7 * 86400000).toISOString() });
      triggerSaveNotification();
    }
  };

  const isVisitor = currentUser?.role === 'visitor';

  // 14 Options for Registered Users vs 8 Options for Visitor Users (Matching screenshot)
  const visitorMenuOptions = [
    { id: 'profile_data', label: 'تحرير البيانات', icon: UserCheck },
    { id: 'my_info', label: 'تحرير معلوماتي', icon: HelpCircle },
    { id: 'username_color', label: 'تغير لون اسم المستخدم', icon: Brush },
    { id: 'ignore', label: 'إدارة التجاهل', icon: Ban },
    { id: 'sound', label: 'اعدادت الصوت', icon: Volume2 },
    { id: 'style', label: 'إعدادات الستايل', icon: Monitor },
    { id: 'privacy', label: 'إعدادات خاصة', icon: MessageSquare },
    { id: 'language', label: 'اللغة / الموقع', icon: Globe },
  ];

  const fullMenuOptions = [
    { id: 'profile_data', label: 'تحرير البيانات', icon: UserCheck },
    { id: 'my_info', label: 'تحرير معلوماتي', icon: HelpCircle },
    { id: 'change_username', label: 'تغيير اسم المستخدم', icon: Edit3 },
    { id: 'username_color', label: 'تغيير لون اسم المستخدم', icon: Brush },
    { id: 'status', label: 'تعديل الحالة', icon: Edit3 },
    { id: 'confirm_account', label: 'تأكيد الحساب', icon: Check },
    { id: 'friends', label: 'إدارة أصدقاء', icon: UserPlus },
    { id: 'ignore', label: 'إدارة التجاهل', icon: Ban },
    { id: 'sound', label: 'اعدادت الصوت', icon: Volume2 },
    { id: 'style', label: 'إعدادات الستايل', icon: Monitor },
    { id: 'privacy', label: 'إعدادات خاصة', icon: MessageSquare },
    { id: 'language', label: 'اللغة / الموقع', icon: Globe },
    { id: 'email', label: 'تعديل البريد الإلكتروني', icon: Mail },
    { id: 'password', label: 'تغيير الباسورد', icon: Key },
    { id: 'delete', label: 'حذف عضوية', icon: Trash2 },
  ];

  const menuOptions = isVisitor ? visitorMenuOptions : fullMenuOptions;

  const handleModalCloseOrBack = () => {
    if (activeSubMenu !== null) {
      setActiveSubMenu(null);
    } else {
      setIsProfileSettingsOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 dir-rtl">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={coverInputRef}
        accept="image/*"
        onChange={handleCoverUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />

      <div className="bg-white rounded-3xl w-full max-w-md sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative select-none border border-slate-200">
        {/* TOP SUCCESS GREEN BAR (شريط أخضر في أعلى الشاشة في وسطه مكتوب تم الحفظ) */}
        {saveSuccess && (
          <div className="absolute top-0 inset-x-0 z-50 bg-[#4caf50] text-white py-3 px-4 font-black text-sm text-center shadow-lg animate-in slide-in-from-top duration-200 flex items-center justify-center gap-2 select-none">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>تم الحفظ</span>
          </div>
        )}
        
        {/* HEADER SECTION (Visitor vs Registered Member) */}
        {isVisitor ? (
          <div className="relative h-40 sm:h-44 w-full bg-[#042730] flex flex-col justify-between p-4 shrink-0">
            {/* Top Left Close/Back Button */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleModalCloseOrBack}
                className="w-8 h-8 rounded-full bg-black/90 hover:bg-black text-rose-500 flex items-center justify-center transition-colors cursor-pointer border border-white/20 shadow-md"
                title={activeSubMenu ? "إلغاء والعودة للقائمة" : "إغلاق"}
              >
                <X className="w-4 h-4 text-rose-500 stroke-[2.5]" />
              </button>
            </div>

            {/* Bottom Right Avatar & Username (Matching Screenshot) */}
            <div className="flex items-center justify-end gap-3 self-end">
              <span className="text-white font-black text-lg sm:text-xl drop-shadow">
                {username || currentUser.username}
              </span>

              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white overflow-hidden bg-slate-800 shrink-0 shadow-lg flex items-center justify-center">
                {(avatar && avatar.trim() !== '') || (currentUser.avatar && currentUser.avatar.trim() !== '') ? (
                  <img src={avatar || currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#073642] flex items-center justify-center text-white/80">
                    <User className="w-10 h-10 stroke-[1.5]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* HEADER COVER BANNER (Matches Registered Member view) */
          <div className="relative h-44 sm:h-48 w-full bg-slate-900 overflow-hidden shrink-0">
            <img
              src={(wallCover && wallCover.trim() !== '') ? wallCover : 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=800&auto=format&fit=crop&q=80'}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

            {/* Top Left Buttons: Red Close/Cancel, Cover Camera, Cover Remove (Black Circular Icons) */}
            <div className="absolute top-3 left-3 flex items-center gap-2 z-20" dir="ltr">
              {/* 1. زر الزائد / الإلغاء الأحمر في أقصى اليسار */}
              <button
                type="button"
                onClick={handleModalCloseOrBack}
                className="w-8 h-8 rounded-full bg-black/90 hover:bg-black text-rose-500 flex items-center justify-center transition-colors cursor-pointer border border-white/20 shadow-md"
                title={activeSubMenu ? "إلغاء والعودة للقائمة" : "إغلاق"}
              >
                <X className="w-4 h-4 text-rose-500 stroke-[2.5]" />
              </button>

              {/* 2. زر الكاميرا في المنتصف لتغيير غلاف الحائط */}
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-8 h-8 rounded-full bg-black/90 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 shadow-md"
                title="تغيير غلاف الحساب"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>

              {/* 3. زر الزائد لحذف صورة الحائط */}
              <button
                type="button"
                onClick={handleRemoveCover}
                className="w-8 h-8 rounded-full bg-black/90 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 shadow-md"
                title="إزالة صورة الحائط"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            {/* User Profile Info Overlay on Cover: Avatar on RIGHT, Name & Status on LEFT */}
            <div className="absolute bottom-3 inset-x-4 flex items-end justify-between z-10" dir="ltr">
              {/* Display Name & Status text on the LEFT */}
              <div className="flex-1 min-w-0 pr-3 text-right">
                <h2
                  style={{
                    color: usernameColor,
                    fontSize: usernameFontSize,
                    textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                  }}
                  className="font-black tracking-wider truncate"
                >
                  {username || currentUser.username}
                </h2>
                <p className="text-xs text-slate-200 font-bold drop-shadow-md truncate mt-0.5">
                  {statusMessage || 'كن أقوى من أعذارك.'}
                </p>
              </div>

              {/* Avatar Frame on the RIGHT */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white shadow-xl overflow-hidden relative bg-slate-800">
                  <UserAvatar
                    avatarUrl={avatar || currentUser.avatar}
                    gender={gender}
                    role={currentUser.role}
                    username={username || currentUser.username}
                    size="xl"
                    className="w-full h-full object-cover"
                  />

                  {/* Avatar Action Icons Overlay: Camera on LEFT, Plus/X on RIGHT */}
                  <div className="absolute inset-x-0 bottom-0 bg-black/85 p-1 flex items-center justify-between px-2 text-white" dir="ltr">
                    {canChangeAvatar ? (
                      <>
                        {/* زر الكاميرا في اليسار */}
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="hover:text-amber-400 cursor-pointer p-0.5 transition-colors"
                          title="تغيير الرمزية"
                        >
                          <Camera className="w-3.5 h-3.5 text-white" />
                        </button>

                        {/* زر الزائد / حذف الرمزية في اليمين */}
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="hover:text-red-400 cursor-pointer p-0.5 transition-colors"
                          title="إزالة الرمزية والعودة للافتراضي"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => alert('🔒 الصورة الشخصية ثابتة للعضو المسجل. ستتمكن من تغيير ورفع صورتك المخصصة عند ترقية حسابك إلى رتبة مميز ⭐ فما فوق.')}
                        className="text-amber-300 hover:text-amber-200 cursor-pointer p-0.5 transition-colors flex items-center justify-center gap-1 w-full"
                        title="الصورة ثابتة للعضو المسجل (الترقية لرتبة مميز مطلوبة لتغييرها)"
                      >
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span className="text-[9px] font-bold">صورة ثابتة</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GREEN VISITOR NOTIFICATION BAR (Matching Screenshot) */}
        {isVisitor && (
          <button
            onClick={() => setActiveSubMenu('register_account')}
            className="bg-[#8cc63f] hover:bg-[#7cb342] text-white px-3 py-2.5 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 w-full cursor-pointer transition-colors text-center shadow-inner border-b border-lime-600/30 shrink-0"
          >
            <span className="text-amber-100 font-extrabold text-sm shrink-0">⚠️</span>
            <span>أنت مسجل حالياً كضيف ، انقر هنا لتسجيل حسابك من أجل الوصول إلى المزيد من الميزات.</span>
          </button>
        )}

        {/* SUBHEADER TAB BAR (Matches Image 2 - 'حساب' Tab) */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0">
          {activeSubMenu ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setActiveSubMenu(null)}
                className="text-xs font-black text-[#0b333e] hover:bg-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة للقائمة الرئيسية</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubMenu(null)}
                className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="إلغاء والعودة لخيارات التعديل"
              >
                <X className="w-3.5 h-3.5" />
                <span>إلغاء (X)</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 font-bold">خيارات الحساب والتعديل</span>
              <div className="bg-[#0b333e] text-white px-4 py-1.5 rounded-lg text-xs font-black shadow-sm flex items-center gap-1.5">
                <span>حساب</span>
              </div>
            </div>
          )}
        </div>

        {/* SCROLLABLE MAIN BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {saveSuccess && (
            <div className="m-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* MENU LIST (When no sub-menu is active) - Image 2 & Image 3 */}
          {!activeSubMenu && (
            <div className="divide-y divide-slate-100">
              {menuOptions.map((opt) => {
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setActiveSubMenu(opt.id)}
                    className="w-full flex items-center justify-between py-3.5 px-5 hover:bg-slate-50 active:bg-slate-100 transition-colors text-right cursor-pointer group"
                  >
                    <span className="text-slate-800 font-bold text-sm group-hover:text-[#0b333e] transition-colors">
                      {opt.label}
                    </span>
                    <IconComponent className="w-5 h-5 text-slate-700 group-hover:text-[#0b333e] transition-colors shrink-0 mr-3" />
                  </button>
                );
              })}
            </div>
          )}

          {/* SUB-MENU 0: تسجيل حساب جديد للزائر (Visitor Registration) */}
          {activeSubMenu === 'register_account' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!username.trim()) {
                  alert('الرجاء أدخال اسم المستخدم');
                  return;
                }
                if (!newPass || newPass !== confirmPass) {
                  alert('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
                  return;
                }
                const now = new Date();
                updateUserProfile({
                  role: 'member',
                  username: username.trim(),
                  password: newPass,
                  joinedDate: formatEnglishDate(now),
                  joinedTimestamp: now.getTime()
                });
                triggerSaveNotification();
              }}
              className="p-5 space-y-4 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0b333e]">تسجيل حساب جديد من أجل الوصول لمزيد من الميزات</h3>
                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 mr-2"
                  title="إلغاء والعودة"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                قم بإنشاء كلمة مرور لحسابك للتحول إلى عضو دائم والاستفادة من كافة ميزات الشات مثل الأصدقاء، الغلاف، والمحادثات الخاصة.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0b333e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  placeholder="أدخل كلمة المرور"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0b333e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  required
                  placeholder="أعِد كتابة كلمة المرور"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0b333e]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#8cc63f] hover:bg-[#7cb342] text-white font-black py-2.5 rounded-xl text-xs cursor-pointer shadow-md transition-colors"
              >
                تسجيل العضوية الآن 🚀
              </button>
            </form>
          )}

          {/* SUB-MENU 1: تحرير البيانات (Edit Profile Data) */}
          {activeSubMenu === 'profile_data' && (
            <form onSubmit={handleSaveData} className="p-5 space-y-5 animate-in fade-in duration-150 text-right">
              <div className="grid grid-cols-2 gap-4">
                {/* Right Column: الجنس */}
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5 text-right">الجنس</label>
                  <div className="relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full bg-[#f2f2f2] border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0b333e] cursor-pointer text-center"
                    >
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                      <option value="other">نوع آخر</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Left Column: العمر */}
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5 text-right">العمر</label>
                  <div className="relative">
                    <select
                      value={age}
                      onChange={(e) => setAge(e.target.value === 'عدم الإظهار' ? 'عدم الإظهار' : Number(e.target.value))}
                      className="w-full bg-[#f2f2f2] border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0b333e] cursor-pointer text-center"
                    >
                      <option value="عدم الإظهار">عدم الإظهار</option>
                      {Array.from({ length: 88 }, (_, i) => i + 12).map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Hide Country Checkbox */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">إخفاء علم الدولة في الكرت السريع</span>
                <input
                  type="checkbox"
                  checked={hideCountry}
                  onChange={(e) => setHideCountry(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0b333e] focus:ring-[#0b333e] cursor-pointer"
                />
              </div>

              {/* Bottom Right Save Button */}
              <div className="flex justify-start pt-2">
                <button
                  type="submit"
                  className="bg-[#0099c8] hover:bg-[#0088b3] text-white px-7 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ</span>
                </button>
              </div>
            </form>
          )}

          {/* SUB-MENU 2: تحرير معلوماتي (Edit My Info / Bio) */}
          {activeSubMenu === 'my_info' && (
            <form onSubmit={handleSaveData} className="p-5 space-y-4 animate-in fade-in duration-150 text-right">
              <div className="text-right">
                <label className="block text-sm font-black text-slate-800 mb-2">معلوماتي</label>
                <div className="bg-[#f4f4f4] border border-slate-200 rounded-lg p-3 sm:p-4">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={6}
                    placeholder="اكتب معلوماتك والعبارات المفضلة هنا..."
                    className="w-full bg-transparent border-none text-xs sm:text-sm font-bold text-slate-800 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Bottom Right Save Button */}
              <div className="flex justify-start pt-2">
                <button
                  type="submit"
                  className="bg-[#0099c8] hover:bg-[#0088b3] text-white px-7 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ</span>
                </button>
              </div>
            </form>
          )}

          {/* SUB-MENU 2.5: تغيير اسم المستخدم (Change Username) */}
          {activeSubMenu === 'change_username' && (
            <div className="p-5 space-y-4 animate-in fade-in duration-150 text-right">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0b333e]">تغيير اسم المستخدم</h3>
              </div>

              {!currentUserCan('change_username') ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5 text-right">
                  <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>ميزة تغيير اسم المستخدم معطلة لرتبتك 🔒</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-bold">
                    قام المالك بتعطيل إمكانية تغيير الاسم المستعار لرتبة ({currentUser?.role ? (RANK_TITLES[currentUser.role] || currentUser.role) : 'الزائر'}). لا يمكنك تعديل الاسم حالياً.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSaveData} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم الجديد:</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#f2f2f2] border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b333e]"
                      placeholder="أدخل الاسم الجديد"
                    />
                  </div>

                  <div className="flex justify-start pt-2">
                    <button
                      type="submit"
                      className="bg-[#0099c8] hover:bg-[#0088b3] text-white px-7 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* SUB-MENU 3: تغيير لون اسم المستخدم (Change Username Color / Style) */}
          {activeSubMenu === 'username_color' && (
            <form onSubmit={handleSaveData} className="p-5 space-y-4 animate-in fade-in duration-150 text-right relative">
              {/* Preview Header */}
              <div className="text-right">
                <span className="text-xs font-black text-slate-700 block mb-1.5">معاينة شكل الاسم</span>
                {/* Live Preview Box */}
                <div className="w-full min-h-[68px] p-4 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center text-center overflow-hidden shadow-inner">
                  <UsernameDisplay
                    username={username || currentUser.username || 'Owner'}
                    usernameColor={usernameColor || '#ffffff'}
                    usernameBgGradient={usernameBgGradient}
                    isNeon={isNeon}
                    fontFamily={FONTS_LIST.find(f => f.name === fontFamily)?.family}
                    fontSize="18px"
                    className="text-lg"
                  />
                </div>
              </div>

              {/* Sub-Tabs Row: لون | نيون | خلفية لامعة */}
              <div className="flex items-center justify-center gap-2 py-1">
                <button
                  type="button"
                  onClick={() => {
                    setColorTab('color');
                    setIsNeon(false);
                  }}
                  className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    colorTab === 'color'
                      ? 'bg-[#e6e6e6] text-slate-900 border border-slate-300 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  لون
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setColorTab('neon');
                    setIsNeon(true);
                  }}
                  className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    colorTab === 'neon'
                      ? 'bg-[#e6e6e6] text-slate-900 border border-slate-300 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  نيون مشع
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setColorTab('bg');
                  }}
                  className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    colorTab === 'bg'
                      ? 'bg-[#e6e6e6] text-slate-900 border border-slate-300 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  خلفية لامعة وبراقة ✨
                </button>
              </div>

              {/* Swatches Grid */}
              {colorTab === 'color' && (
                <div className="grid grid-cols-6 gap-1.5 p-1 max-h-[190px] overflow-y-auto custom-scrollbar">
                  {SOLID_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setUsernameColor(c);
                        setIsNeon(false);
                      }}
                      style={{ backgroundColor: c }}
                      className={`w-full aspect-square rounded-sm border cursor-pointer transition-transform hover:scale-105 ${
                        usernameColor === c ? 'border-2 border-slate-900 scale-105' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              )}

              {colorTab === 'neon' && (
                <div className="grid grid-cols-6 gap-1.5 p-1 max-h-[190px] overflow-y-auto custom-scrollbar">
                  {NEON_SWATCHES.map((c) => {
                    const isSelected = usernameColor === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setUsernameColor(c);
                          setIsNeon(true);
                        }}
                        style={{
                          backgroundColor: c,
                          boxShadow: `0 0 8px ${c}`
                        }}
                        className={`w-full aspect-square rounded-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-105 relative ${
                          isSelected ? 'ring-2 ring-slate-900 z-10' : ''
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white drop-shadow font-black" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {colorTab === 'bg' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-slate-500">اختر خلفية براقة للاسم:</span>
                    <button
                      type="button"
                      onClick={() => setUsernameBgGradient('')}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-0.5 rounded-md border border-red-200 cursor-pointer"
                    >
                      إلغاء الخلفية ✖
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2 p-1 max-h-[210px] overflow-y-auto custom-scrollbar">
                    {GRADIENT_SWATCHES.map((g, idx) => {
                      const isSelected = usernameBgGradient === g;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setUsernameBgGradient(g)}
                          style={{ background: g }}
                          className={`w-full aspect-square rounded-lg cursor-pointer transition-transform hover:scale-110 shadow-sm border ${
                            isSelected ? 'ring-2 ring-blue-600 scale-105 border-white shadow-md' : 'border-white/20'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Font Selector Box */}
              <div className="pt-1">
                <label className="block text-xs font-black text-slate-800 mb-1.5 text-right">الخط</label>
                <div
                  onClick={() => setOpenFontPickerModal(true)}
                  className="w-full bg-[#f4f4f4] border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-200/80 transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                  <span style={{ fontFamily: FONTS_LIST.find(f => f.name === fontFamily)?.family || 'Cairo, sans-serif' }}>
                    {fontFamily}
                  </span>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-start pt-2">
                <button
                  type="submit"
                  className="bg-[#0099c8] hover:bg-[#0088b3] text-white px-7 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ</span>
                </button>
              </div>

              {/* Font Picker Popup Overlay (Matches Screenshots 6 & 7) */}
              {openFontPickerModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-[#f5f5f7] rounded-3xl w-full max-w-xs max-h-[75vh] flex flex-col overflow-hidden shadow-2xl border border-slate-300">
                    <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">اختر الخط</span>
                      <button
                        type="button"
                        onClick={() => setOpenFontPickerModal(false)}
                        className="p-1 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {FONTS_LIST.map((f) => {
                        const isSelected = fontFamily === f.name;
                        return (
                          <button
                            key={f.name}
                            type="button"
                            onClick={() => {
                              setFontFamily(f.name);
                              setOpenFontPickerModal(false);
                            }}
                            className={`w-full p-2.5 rounded-xl flex items-center justify-between text-right cursor-pointer transition-colors ${
                              isSelected ? 'bg-slate-200/80 font-black' : 'hover:bg-slate-100'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center shrink-0">
                              {isSelected && <div className="w-3 h-3 rounded-full bg-[#0b333e]" />}
                            </div>
                            <span
                              style={{ fontFamily: f.family }}
                              className="text-sm text-slate-800 font-bold"
                            >
                              {f.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* SUB-MENU 4: تعديل الحالة (Edit Status) */}
          {activeSubMenu === 'status' && (
            <form onSubmit={handleSaveData} className="p-5 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0b333e]">تعديل رسالة الحالة</h3>
                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 mr-2"
                  title="إلغاء والعودة"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رسالة الحالة القصيرة:</label>
                <input
                  type="text"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="مثال: كن أقوى من أعذارك."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0b333e]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0b333e] hover:bg-[#07242c] text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-md transition-colors"
              >
                حفظ الحالة
              </button>
            </form>
          )}

          {/* SUB-MENU 5: تأكيد الحساب (Confirm Account) */}
          {activeSubMenu === 'confirm_account' && (
            <div className="p-5 space-y-4 animate-in fade-in duration-150 text-right">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0b333e]">تأكيد وتوثيق الحساب</h3>
                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 mr-2"
                  title="إلغاء والعودة"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء</span>
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>حالة الحساب: مؤكّد وموثق ✔️</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  حسابك موثق رسمياً في منصة الشات مع حماية كاملة للهوية والرتبة.
                </p>
              </div>
            </div>
          )}

          {/* SUB-MENU 6: إدارة أصدقاء (Manage Friends) */}
          {activeSubMenu === 'friends' && (
            <div className="p-5 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0b333e]">
                  إدارة قائمة الأصدقاء ({friendUsers.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 mr-2"
                  title="إلغاء والعودة"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء</span>
                </button>
              </div>

              {friendUsers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-bold">
                  لا يوجد أصدقاء مضافين حالياً.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {friendUsers.map((f) => (
                    <div key={f.id} className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserAvatar avatarUrl={f.avatar} gender={f.gender} role={f.role} username={f.username} size="sm" />
                        <span className="font-bold text-xs text-slate-900">{f.username}</span>
                      </div>
                      <button
                        onClick={() => {
                          removeFriend(f.id);
                          triggerSaveNotification();
                        }}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-xl cursor-pointer text-xs font-bold border border-red-200"
                        title="إلغاء الصداقة"
                      >
                        ❌ إلغاء الصداقة
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-MENU 7: إدارة التجاهل (Manage Ignored Users) */}
          {activeSubMenu === 'ignore' && (
            <div className="p-5 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0b333e]">
                  إدارة قائمة المتجاهلين ({ignoredUsersList.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 mr-2"
                  title="إلغاء والعودة"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء</span>
                </button>
              </div>

              {ignoredUsersList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-bold">
                  قائمة التجاهل فارغة حالياً.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {ignoredUsersList.map((u) => (
                    <div key={u.id} className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserAvatar avatarUrl={u.avatar} gender={u.gender} role={u.role} username={u.username} size="sm" />
                        <span className="font-bold text-xs text-slate-900">{u.username}</span>
                      </div>
                      <button
                        onClick={() => {
                          requestBlockConfirm(u, 'unblock', () => {
                            toggleIgnore(u.id);
                            triggerSaveNotification();
                          });
                        }}
                        className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl cursor-pointer text-xs font-bold transition-colors"
                      >
                        🔓 إلغاء التجاهل
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-MENU 8: اعدادات الصوت (Sound Settings) */}
          {activeSubMenu === 'sound' && (
            <div className="p-5 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0b333e]">إعدادات الصوت والتنبيهات</h3>
                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 mr-2"
                  title="إلغاء والعودة"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: 'privateSound', label: 'تنبيه صوتي للرسائل الخاصة 💬', soundType: 'private' },
                  { key: 'friendRequestSound', label: 'تنبيه طلبات الصداقة 👥', soundType: 'friend_request' },
                  { key: 'publicSound', label: 'صوت الرسائل العامة 💬', soundType: 'public' },
                  { key: 'mentionSound', label: 'صوت المنشن والإشارة 🏷️', soundType: 'mention' },
                  { key: 'notifSound', label: 'صوت الإشعارات العامة 🔔', soundType: 'notification' },
                ].map((item) => {
                  const val = (audioSettings as any)[item.key] !== false;
                  return (
                    <div key={item.key} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="font-bold text-slate-800 text-xs">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => playChatSound(item.soundType as any)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Volume1 className="w-3.5 h-3.5 text-[#0b333e]" />
                          <span>تجربة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateAudioSettings({ [item.key]: !val })}
                          className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                            val ? 'bg-[#0b333e] text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {val ? 'تشغيل 🔊' : 'إيقاف 🔇'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Save & Cancel Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => triggerSaveNotification()}
                  className="bg-[#0099c8] hover:bg-[#0088b3] text-white font-bold px-7 py-2.5 rounded-lg text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="bg-[#082831] hover:bg-[#051c23] text-white font-bold px-7 py-2.5 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* SUB-MENU 9: إعدادات الستايل (Style Settings) */}
          {activeSubMenu === 'style' && (
            <div className="p-5 space-y-4 animate-in fade-in duration-150 relative">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0b333e]">إعدادات الستايل</h3>
                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 mr-2"
                  title="إلغاء والعودة"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء</span>
                </button>
              </div>

              {/* Theme Dropdown Field matching Screenshot 1 */}
              <div className="space-y-1.5 pt-1 text-right">
                <label className="text-xs font-bold text-slate-700 block pr-0.5">
                  الثيم
                </label>
                <button
                  type="button"
                  onClick={() => setIsThemeSelectModalOpen(true)}
                  className="w-full bg-[#f8fafc] hover:bg-[#f1f5f9] border border-slate-300 rounded px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-800 flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
                >
                  {/* Downward triangle arrow */}
                  <span className="text-slate-500 text-[10px]">▼</span>
                  <span>
                    {THEME_OPTIONS.find(t => t.id === themeMode)?.name || 'الثيم الافتراضي'}
                  </span>
                </button>
              </div>

              {/* Save Notification / Banner trigger */}
              <div className="pt-2">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  يتم تطبيق وحفظ الثيم المختار فوراً على مظهر المحادثة والغرف.
                </p>
              </div>
            </div>
          )}

          {/* SUB-MENU 10: إعدادات خاصة (Private Chat Settings) */}
          {activeSubMenu === 'privacy' && (
            <div className="p-5 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0b333e]">إعدادات خصوصية الرسائل الخاصة</h3>
                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 mr-2"
                  title="إلغاء والعودة"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء</span>
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-500">من يمكنه إرسال رسائل خاصة لك:</p>
                {[
                  { id: 'everyone', label: '1. للجميع: استقبال من الكل' },
                  { id: 'members', label: '2. للأعضاء فقط' },
                  { id: 'friends', label: '3. للأصدقاء فقط' },
                  { id: 'none', label: '4. إيقاف الخاصة عن الجميع' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPrivatePrivacy(p.id as PrivatePrivacySetting)}
                    className={`w-full text-right p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      privatePrivacy === p.id
                        ? 'bg-[#0b333e] text-white border-[#0b333e]'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Private Message Sound Notification Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 mb-2">التنبيهات الصوتية للخاص:</p>
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="font-bold text-slate-800 text-xs">صوت التنبيه للرسائل الخاصة 💬</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => playChatSound('private')}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Volume1 className="w-3.5 h-3.5 text-[#0b333e]" />
                      <span>تجربة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateAudioSettings({ privateSound: !(audioSettings?.privateSound !== false) })}
                      className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                        audioSettings?.privateSound !== false ? 'bg-[#0b333e] text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {audioSettings?.privateSound !== false ? 'تشغيل 🔊' : 'إيقاف 🔇'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Save & Cancel Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    updateUserProfile({ privatePrivacy });
                    triggerSaveNotification();
                  }}
                  className="bg-[#0099c8] hover:bg-[#0088b3] text-white font-bold px-7 py-2.5 rounded-lg text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="bg-[#082831] hover:bg-[#051c23] text-white font-bold px-7 py-2.5 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* SUB-MENU 11: اللغة / الموقع (Language / Location) */}
          {activeSubMenu === 'language' && (
            <div className="p-5 space-y-4 animate-in fade-in duration-150 dir-rtl relative">
              {/* Top Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-black text-[#0b333e]">اللغة / الموقع</h3>
                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="p-1 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Field: اللغة */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 text-right">
                  اللغة
                </label>
                <button
                  type="button"
                  onClick={() => setOpenLocPickerModal('lang')}
                  className="w-full bg-[#f2f2f2] hover:bg-[#e8e8e8] border border-slate-200 rounded-lg p-3 flex items-center justify-between cursor-pointer transition-colors text-right"
                >
                  <span className="text-slate-800 font-semibold text-xs sm:text-sm">
                    {selectedLang}
                  </span>
                  <span className="text-slate-600 text-[10px] text-[#0b333e] font-bold">▼</span>
                </button>
              </div>

              {/* 2. Field: البلد */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 text-right">
                  البلد
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCountrySearchQuery('');
                    setOpenLocPickerModal('country');
                  }}
                  className="w-full bg-[#f2f2f2] hover:bg-[#e8e8e8] border border-slate-200 rounded-lg p-3 flex items-center justify-between cursor-pointer transition-colors text-right"
                >
                  <div className="flex items-center gap-2">
                    {selectedCountryLoc !== 'عدم إظهار' && (
                      <span className="text-xl leading-none">{getCountryFlagByName(selectedCountryLoc)}</span>
                    )}
                    <span className="text-slate-800 font-semibold text-xs sm:text-sm">
                      {selectedCountryLoc === 'عدم إظهار' ? 'عدم إظهار' : (getEnglishCountryName(selectedCountryLoc) || selectedCountryLoc)}
                    </span>
                  </div>
                  <span className="text-slate-600 text-[10px] text-[#0b333e] font-bold">▼</span>
                </button>
              </div>

              {/* 3. Field: منطقة التوقيت الزمني */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 text-right">
                  منطقة التوقيت الزمني
                </label>
                <button
                  type="button"
                  onClick={() => setOpenLocPickerModal('timezone')}
                  className="w-full bg-[#f2f2f2] hover:bg-[#e8e8e8] border border-slate-200 rounded-lg p-3 flex items-center justify-between cursor-pointer transition-colors text-right"
                >
                  <span className="text-slate-800 font-semibold text-xs sm:text-sm">
                    {selectedTimezoneLoc}
                  </span>
                  <span className="text-slate-600 text-[10px] text-[#0b333e] font-bold">▼</span>
                </button>
              </div>

              {/* Action Buttons: حفظ / إلغاء */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const previousLang = getAppLanguage();
                    localStorage.setItem('selectedLang', selectedLang);
                    localStorage.setItem('selectedTimezone', selectedTimezoneLoc);
                    applyLanguageSettings(selectedLang);

                    const isLangChanged = previousLang !== selectedLang;

                    if (selectedCountryLoc === 'عدم إظهار') {
                      updateUserProfile({
                        language: selectedLang,
                        country: 'عدم إظهار',
                        countryFlag: '',
                        hideCountry: true,
                        showCountryFlag: false,
                        countryModified: true
                      });
                    } else {
                      const arabicName = getArabicCountryName(selectedCountryLoc);
                      const flag = getCountryFlagByName(arabicName);
                      updateUserProfile({
                        language: selectedLang,
                        country: arabicName,
                        countryFlag: flag,
                        hideCountry: false,
                        showCountryFlag: true,
                        countryModified: true
                      });
                    }

                    triggerSaveNotification();
                    if (isLangChanged) {
                      setTimeout(() => {
                        window.location.reload();
                      }, 500);
                    }
                  }}
                  className="bg-[#0099c8] hover:bg-[#0088b3] text-white font-bold px-7 py-2.5 rounded-lg text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('settings.save', 'حفظ')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="bg-[#082831] hover:bg-[#051c23] text-white font-bold px-7 py-2.5 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  {t('settings.cancel', 'إلغاء')}
                </button>
              </div>

              {/* POPUP PICKER MODAL OVERLAY */}
              {openLocPickerModal && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 dir-rtl animate-in fade-in duration-150">
                  <div className="bg-white rounded-3xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl relative overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
                    {/* Header with X button */}
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">
                        {openLocPickerModal === 'lang' && 'اختر اللغة'}
                        {openLocPickerModal === 'country' && 'اختر البلد'}
                        {openLocPickerModal === 'timezone' && 'اختر منطقة التوقيت الزمني'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenLocPickerModal(null)}
                        className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto flex-1">
                      {openLocPickerModal === 'lang' && (
                        <div className="p-2 divide-y divide-slate-100">
                          {POPUP_LANGUAGES.map((langItem) => {
                            const isSelected = selectedLang === langItem;
                            return (
                              <button
                                key={langItem}
                                type="button"
                                onClick={() => {
                                  setSelectedLang(langItem);
                                  setOpenLocPickerModal(null);
                                }}
                                className="w-full flex items-center justify-between py-2.5 px-4 hover:bg-slate-50 cursor-pointer transition-colors text-right"
                              >
                                {/* Selected Radio Indicator on Left */}
                                {isSelected ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-indigo-900 flex items-center justify-center shrink-0">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-900" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                                )}

                                {/* Text on Right */}
                                <span className={`text-xs sm:text-sm font-medium ${isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                                  {langItem}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {openLocPickerModal === 'country' && (
                        <div className="flex flex-col h-full">
                          <div className="overflow-y-auto p-1 divide-y divide-slate-100 flex-1 max-h-[65vh]">
                            {/* Hide Country Option */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCountryLoc('عدم إظهار');
                                setOpenLocPickerModal(null);
                              }}
                              className="w-full flex items-center justify-between py-2.5 px-3.5 hover:bg-slate-50 cursor-pointer transition-colors text-right"
                            >
                              {selectedCountryLoc === 'عدم إظهار' ? (
                                <div className="w-5 h-5 rounded-full border-2 border-indigo-900 flex items-center justify-center shrink-0">
                                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-900" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                              )}
                              <span className={`text-xs sm:text-sm font-medium ${selectedCountryLoc === 'عدم إظهار' ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                                عدم إظهار
                              </span>
                            </button>

                            {/* All World Countries List with Full English Name + Flag */}
                            {COUNTRIES_LIST.map((countryItem) => {
                              const isSelected = selectedCountryLoc === countryItem.englishName || selectedCountryLoc === countryItem.name || selectedCountryLoc === countryItem.code;
                              return (
                                <button
                                  key={countryItem.code}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCountryLoc(countryItem.englishName);
                                    setOpenLocPickerModal(null);
                                  }}
                                  className={`w-full flex items-center justify-between py-2.5 px-3.5 hover:bg-slate-50 cursor-pointer transition-colors text-right ${isSelected ? 'bg-indigo-50/50' : ''}`}
                                >
                                  {isSelected ? (
                                    <div className="w-5 h-5 rounded-full border-2 border-indigo-900 flex items-center justify-center shrink-0">
                                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-900" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                                  )}

                                  <div className="flex items-center gap-2.5">
                                    <span className={`text-xs sm:text-sm font-semibold tracking-wide ${isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                                      {countryItem.englishName}
                                    </span>
                                    <span className="text-xl leading-none">{countryItem.flag}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {openLocPickerModal === 'timezone' && (
                        <div className="p-2 divide-y divide-slate-100">
                          {POPUP_TIMEZONES.map((tzItem) => {
                            const isSelected = selectedTimezoneLoc === tzItem;
                            return (
                              <button
                                key={tzItem}
                                type="button"
                                onClick={() => {
                                  setSelectedTimezoneLoc(tzItem);
                                  setOpenLocPickerModal(null);
                                }}
                                className="w-full flex items-center justify-between py-2.5 px-4 hover:bg-slate-50 cursor-pointer transition-colors text-right"
                              >
                                {/* Selected Radio Indicator on Left */}
                                {isSelected ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-indigo-900 flex items-center justify-center shrink-0">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-900" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                                )}

                                {/* Text on Right */}
                                <span className={`text-xs sm:text-sm font-medium ${isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                                  {tzItem}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-MENU 12: تعديل البريد الإلكتروني (Edit Email) */}
          {activeSubMenu === 'email' && (
            <form onSubmit={handleSaveData} className="p-5 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0b333e]">تعديل البريد الإلكتروني</h3>
                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 mr-2"
                  title="إلغاء والعودة"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان البريد الإلكتروني:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0b333e] dir-ltr text-right"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0b333e] hover:bg-[#07242c] text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-md transition-colors"
              >
                حفظ البريد
              </button>
            </form>
          )}

          {/* SUB-MENU 13: تغيير الباسورد (Change Password) */}
          {activeSubMenu === 'password' && (
            <form onSubmit={handleChangePassword} className="p-5 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0b333e]">تغيير كلمة المرور</h3>
                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 mr-2"
                  title="إلغاء والعودة"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور القديمة</label>
                <input
                  type="password"
                  required
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0b333e] hover:bg-[#07242c] text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-md transition-colors"
              >
                تغيير كلمة المرور
              </button>
            </form>
          )}

          {/* SUB-MENU 14: حذف عضوية (Delete Account) */}
          {activeSubMenu === 'delete' && (
            <div className="p-5 space-y-4 animate-in fade-in duration-150 text-right">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-red-600">حذف العضوية النهائي</h3>
                <button
                  type="button"
                  onClick={() => setActiveSubMenu(null)}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 mr-2"
                  title="إلغاء والعودة"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء</span>
                </button>
              </div>

              <div className="bg-red-50 p-4 rounded-2xl border border-red-200 space-y-2">
                <span className="font-bold text-red-800 text-xs block">تحذير حذف العضوية ⚠️</span>
                <p className="text-red-700 text-xs leading-relaxed font-medium">
                  عند الحذف، سيتم جدولتها للحذف النهائي بعد أسبوع تلقائياً ويمكنك إلغاؤها قبل ذلك عبر الدعم.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer mt-2"
                >
                  حذف العضوية الآن 🗑️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* POPUP: Theme Selection Modal (مطابق للصورة 2: نافذة راديو خيارات الثيم) */}
      {isThemeSelectModalOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsThemeSelectModalOpen(false)}
        >
          <div
            className="bg-white text-slate-900 rounded-3xl w-full max-w-xs shadow-2xl p-5 space-y-3 animate-in zoom-in-95 duration-100 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="space-y-2">
              {THEME_OPTIONS.map((t) => {
                const isSelected = (themeMode === t.id) || (themeMode === 'light' && t.id === 'lite');
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTheme(t.id);
                      setThemeMode(t.id);
                      try {
                        localStorage.setItem('araby_chat_theme', t.id);
                      } catch (err) {
                        console.error('Failed to save theme to localStorage', err);
                      }
                      setIsThemeSelectModalOpen(false);
                      triggerSaveNotification();
                    }}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group text-right"
                  >
                    {/* Radio circle */}
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-slate-400 group-hover:border-purple-600 transition-colors">
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#5c2d91]" />
                      )}
                    </div>

                    <span className="text-sm font-medium text-slate-800">
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
