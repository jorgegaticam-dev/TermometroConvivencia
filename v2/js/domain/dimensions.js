// ======================================
// INSTRUMENTO · 7 DIMENSIONES
// ======================================

export const DIMENSIONS = Object.freeze([
  {
    key: "bienestar",
    label: "Bienestar",
    question: "Me siento cómodo asistiendo al establecimiento.",
    short: "Bienestar"
  },
  {
    key: "inclusion",
    label: "Inclusión",
    question: "Me siento incluido en mi curso.",
    short: "Inclusión"
  },
  {
    key: "buenTrato",
    label: "Buen Trato",
    question: "Mis compañeros me tratan con respeto.",
    short: "Buen trato"
  },
  {
    key: "participacion",
    label: "Participación",
    question: "Puedo expresar mis opiniones libremente.",
    short: "Participación"
  },
  {
    key: "seguridad",
    label: "Seguridad",
    question: "Me siento seguro dentro del establecimiento.",
    short: "Seguridad"
  },
  {
    key: "pertenencia",
    label: "Pertenencia",
    question: "Me siento parte importante de mi curso.",
    short: "Pertenencia"
  },
  {
    key: "relaciones",
    label: "Relaciones",
    question: "Tengo buenas relaciones con mis profesores.",
    short: "Relaciones"
  }
]);

export const DIMENSION_KEYS = Object.freeze(
  DIMENSIONS.map(dimension => dimension.key)
);

export const LIKERT = Object.freeze([
  { value: 1, label: "Muy en desacuerdo", short: "1" },
  { value: 2, label: "En desacuerdo", short: "2" },
  { value: 3, label: "Ni de acuerdo ni en desacuerdo", short: "3" },
  { value: 4, label: "De acuerdo", short: "4" },
  { value: 5, label: "Muy de acuerdo", short: "5" }
]);
