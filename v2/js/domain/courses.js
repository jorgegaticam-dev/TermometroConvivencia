// ======================================
// CURSOS Y NIVELES
// ======================================

export const COURSES = Object.freeze([
  "7° Básico A",
  "7° Básico B",
  "7° Básico C",
  "7° Básico D",
  "7° Básico E",

  "8° Básico A",
  "8° Básico B",
  "8° Básico C",
  "8° Básico D",
  "8° Básico E",
  "8° Básico F",

  "1° Medio A",
  "1° Medio B",
  "1° Medio C",
  "1° Medio D",
  "1° Medio E",
  "1° Medio F",

  "2° Medio A",
  "2° Medio B",
  "2° Medio C",
  "2° Medio D",
  "2° Medio E",
  "2° Medio F",

  "3° Medio A",
  "3° Medio B",
  "3° Medio C",
  "3° Medio D",
  "3° Medio E",
  "3° Medio F",

  "4° Medio A",
  "4° Medio B",
  "4° Medio C",
  "4° Medio D",
  "4° Medio E",
  "4° Medio F"
]);

export const LEVELS = Object.freeze([
  "7° Básico",
  "8° Básico",
  "1° Medio",
  "2° Medio",
  "3° Medio",
  "4° Medio"
]);

export function levelFromCourse(curso) {
  const normalized = String(curso || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const match = normalized.match(/^(\d)°\s*(Basico|Medio)/i);

  if (!match) return "Otro";

  const type = match[2].toLowerCase() === "basico" ? "Básico" : "Medio";
  return `${match[1]}° ${type}`;
}

export function isValidCourse(curso) {
  return COURSES.includes(String(curso || "").trim());
}

export function groupCoursesByLevel() {
  const groups = new Map(LEVELS.map(level => [level, []]));

  COURSES.forEach(curso => {
    const level = levelFromCourse(curso);
    if (!groups.has(level)) groups.set(level, []);
    groups.get(level).push(curso);
  });

  return [...groups.entries()].filter(([, courses]) => courses.length > 0);
}
