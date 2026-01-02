export function extractYearFromSemester(semester: string): number | undefined {
  const match = semester.match(/(\d{4})/);
  if (!match) return undefined;
  const year = parseInt(match[1]!, 10);
  return Number.isNaN(year) ? undefined : year;
}

export function attachYear<T extends { semester: string }>(timetable: T, fallbackYear?: number) {
  const derivedYear = extractYearFromSemester(timetable.semester);
  return {
    ...timetable,
    year: derivedYear ?? fallbackYear ?? new Date().getFullYear(),
  };
}
