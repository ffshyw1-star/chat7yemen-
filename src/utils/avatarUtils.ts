import { Gender } from '../types';

export function getDefaultAvatar(gender?: Gender): string {
  if (gender === 'female') {
    return '/default_female.svg';
  }
  return '/default_male.svg';
}

export function resolveUserAvatar(avatarUrl?: string, gender?: Gender): string {
  if (avatarUrl && avatarUrl.trim() !== '' && !avatarUrl.includes('undefined') && !avatarUrl.includes('null')) {
    return avatarUrl;
  }
  return getDefaultAvatar(gender);
}
