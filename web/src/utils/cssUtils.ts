/**
 * Create space delimited className string from an array of strings.
 */
export function className(
  ...names: (string | false | null | undefined)[]
): string {
  return names.filter(Boolean).join(' ')
}
