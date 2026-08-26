export const getFlagEmoji = (countryCode?: string): string => {
    if (!countryCode || countryCode.length !== 2) return '';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + (char.codePointAt(0) ?? 0));
    return String.fromCodePoint(...codePoints);
};