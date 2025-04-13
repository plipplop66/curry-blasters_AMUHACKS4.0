const profanityList = [
  'ass', 'asshole', 'bastard', 'bitch', 'bullshit', 'crap', 'damn', 'dick', 'douche',
  'dumbass', 'fuck', 'fucking', 'motherfucker', 'piss', 'shit', 'whore'
];

export function filterProfanity(text: string): string {
  if (!text) return text;
  
  let filteredText = text;
  
  profanityList.forEach(word => {
    // Case insensitive replace with asterisks
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const replacement = '*'.repeat(word.length);
    filteredText = filteredText.replace(regex, replacement);
  });
  
  return filteredText;
}

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  
  const textLower = text.toLowerCase();
  return profanityList.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(textLower);
  });
}
