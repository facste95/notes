// src/lib/emptyStateMessages.js
export const emptyStateMessages = {
  en: [
    'Welcome to Folia. Create your first note from the sidebar.',
    'Every great story starts with a blank page.',
    'Your notes are stored privately, right here on your device.',
    'Tip: Use Ctrl+\\ to toggle the sidebar.',
    'Tip: Press Ctrl+K to search your notes.',
    'Tip: Switch between Rich and Markdown mode in the editor toolbar.',
    '"The secret of getting ahead is getting started." — Mark Twain',
    '"Write what should not be forgotten." — Isabel Allende',
    '"A word after a word after a word is power." — Margaret Atwood'
  ],
  it: [
    'Benvenuto in Folia. Crea la tua prima nota dalla sidebar.',
    'Ogni grande storia inizia da una pagina bianca.',
    'Le tue note sono conservate privatamente, qui sul tuo dispositivo.',
    'Suggerimento: usa Ctrl+\\ per mostrare o nascondere la sidebar.',
    'Suggerimento: premi Ctrl+K per cercare tra le note.',
    'Suggerimento: passa dalla modalità Rich a Markdown nella toolbar.',
    '«Il segreto per andare avanti è cominciare.» — Mark Twain',
    '«Scrivi ciò che non dovrebbe essere dimenticato.» — Isabel Allende',
    '«Una parola dopo un\'altra parola dopo un\'altra è potere.» — Margaret Atwood'
  ]
};

export function pickRandomMessage(lang) {
  const messages = emptyStateMessages[lang] ?? emptyStateMessages.en;
  return messages[Math.floor(Math.random() * messages.length)];
}
