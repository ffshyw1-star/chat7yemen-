import { Gender, UserRole } from '../types';

export function getDefaultAvatar(gender?: Gender | string, role?: UserRole | string): string {
  if (role === 'visitor') {
    return '/default_guest.svg';
  }
  if (gender === 'female') {
    return '/default_female.svg';
  }
  return '/default_male.svg';
}

export function resolveUserAvatar(avatarUrl?: string, gender?: Gender | string, role?: UserRole | string): string {
  if (role === 'visitor') {
    return '/default_guest.svg';
  }
  if (avatarUrl && avatarUrl.trim() !== '' && !avatarUrl.includes('undefined') && !avatarUrl.includes('null')) {
    return avatarUrl;
  }
  return getDefaultAvatar(gender, role);
}
