export function scopeToFieldName(scope: string): string {
  return scope.replace(/^#\/properties\//, "").replaceAll("/properties/", ".");
}
