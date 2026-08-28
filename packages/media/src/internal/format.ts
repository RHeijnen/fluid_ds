/** Format a media display number without allowing an invalid browser locale to break controls. */
export function formatMediaNumber(value: number, locale: string, minimumIntegerDigits = 1): string {
  try {
    return new Intl.NumberFormat(locale, { useGrouping: false, minimumIntegerDigits }).format(
      value
    );
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return new Intl.NumberFormat("en", { useGrouping: false, minimumIntegerDigits }).format(value);
  }
}
