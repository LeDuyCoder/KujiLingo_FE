const hiraganaToRomajiMap: Record<string, string> = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'wo', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'dji', 'づ': 'dzu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'ー': '-',
};

export function convertHiraganaToRomaji(hiragana: string): string {
  if (!hiragana) return "";
  let romaji = "";
  let i = 0;
  while (i < hiragana.length) {
    const char = hiragana[i];
    const nextChar = hiragana[i + 1];
    
    // Double consonants (small tsu)
    if (char === 'っ' && nextChar) {
      const nextRomaji = hiraganaToRomajiMap[nextChar] || "";
      if (nextRomaji) {
        romaji += nextRomaji[0];
      }
      i++;
      continue;
    }
    
    // Digraphs (ya, yu, yo combinations)
    if (nextChar && ['ゃ', 'ゅ', 'ょ'].includes(nextChar)) {
      const base = hiraganaToRomajiMap[char] || "";
      let consonant = base.length > 1 ? base.substring(0, base.length - 1) : base;
      if (char === 'し') consonant = 'sh';
      if (char === 'ち') consonant = 'ch';
      if (char === 'じ') consonant = 'j';
      const glide = nextChar === 'ゃ' ? 'ya' : nextChar === 'ゅ' ? 'yu' : 'yo';
      romaji += consonant + glide.substring(1);
      i += 2;
      continue;
    }
    
    romaji += hiraganaToRomajiMap[char] || char;
    i++;
  }
  return romaji;
}
