const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/**
 * Converts Latin digits to Persian-Indic digits.
 *
 * Presentation only: use this for navigation numbering, listing numbers and
 * progress counts. Never apply it to code, terminal output, or version
 * strings — `1.97.0` must stay `1.97.0`.
 */
export function toPersianDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]!);
}
