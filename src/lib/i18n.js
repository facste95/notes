import { addMessages, init, getLocaleFromNavigator, locale } from 'svelte-i18n';
import it from '../i18n/it.json';
import en from '../i18n/en.json';

addMessages('it', it);
addMessages('en', en);

export function setupI18n(savedLocale) {
  const initialLocale = savedLocale ?? getLocaleFromNavigator() ?? 'it';
  const normalizedLocale = initialLocale.startsWith('it') ? 'it' : 'en';

  init({
    fallbackLocale: 'it',
    initialLocale: normalizedLocale
  });
}

export { locale };
