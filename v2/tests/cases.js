// ======================================
// CASOS DE PRUEBA · COMPARTIDOS NODE/NAVEGADOR
// ======================================

import {
  aggregateResponses,
  categoryKeyFromAverage,
  buildSnapshot,
  latestByCourse,
  normalizeMeasurement,
  rankingByCourse,
  groupByLevel,
  round2
} from "../js/domain/scoring.js";
import {
  levelFromCourse,
  isValidCourse,
  groupCoursesByLevel
} from "../js/domain/courses.js";
import {
  validateSurveyInput,
  validateResponse,
  validateManualRows
} from "../js/domain/validation.js";
import {
  parseDate,
  toIsoDate,
  dateSortValue,
  formatTodayLong
} from "../js/utils/dates.js";
import { toCsv } from "../js/utils/format.js";

function fail(message) {
  throw new Error(message);
}

function assertEqual(actual, expected, message = "") {
  if (typeof actual === "object" && actual !== null) {
    const actualText = JSON.stringify(actual);
    const expectedText = JSON.stringify(expected);

    if (actualText !== expectedText) {
      fail(`${message} Esperado ${expectedText}, recibido ${actualText}.`);
    }
    return;
  }

  if (actual !== expected) {
    fail(`${message} Esperado ${String(expected)}, recibido ${String(actual)}.`);
  }
}

function assertClose(actual, expected, message = "") {
  const difference = Math.abs(Number(actual) - Number(expected));

  if (difference > 0.001) {
    fail(`${message} Esperado ≈${expected}, recibido ${actual}.`);
  }
}

function assertTrue(condition, message = "Se esperaba una condición verdadera.") {
  if (!condition) fail(message);
}

function response(values) {
  return {
    bienestar: values[0],
    inclusion: values[1],
    buenTrato: values[2],
    participacion: values[3],
    seguridad: values[4],
    pertenencia: values[5],
    relaciones: values[6]
  };
}

function measurement({
  id,
  fecha,
  curso,
  promedio,
  creadoEn = "",
  nivel = "",
  categoria = "",
  responsable = "Responsable",
  participantes = 30
}) {
  return normalizeMeasurement({
    id,
    fecha,
    curso,
    nivel,
    promedio,
    categoria,
    responsable,
    participantes,
    creadoEn,
    dimensiones: {
      bienestar: promedio,
      inclusion: promedio,
      buenTrato: promedio,
      participacion: promedio,
      seguridad: promedio,
      pertenencia: promedio,
      relaciones: promedio
    }
  });
}

export const cases = [
  {
    name: "round2 redondea a dos decimales",
    run() {
      assertEqual(round2(3.456), 3.46);
      assertEqual(round2(0), 0);
      assertEqual(round2("no-numero"), 0);
    }
  },
  {
    name: "aggregateResponses calcula dimensiones y promedio",
    run() {
      const result = aggregateResponses([
        response([5, 5, 5, 5, 5, 5, 5]),
        response([3, 3, 3, 3, 3, 3, 3])
      ]);

      assertEqual(result.participantes, 2);
      assertEqual(result.dimensiones.bienestar, 4);
      assertEqual(result.promedio, 4);
      assertEqual(result.categoria, "DESARROLLO");
    }
  },
  {
    name: "aggregateResponses ignora valores fuera de escala",
    run() {
      const result = aggregateResponses([
        response([5, 5, 5, 5, 5, 5, 5]),
        response([0, 6, 3, 3, 3, 3, 3])
      ]);

      assertEqual(result.dimensiones.bienestar, 5);
      assertEqual(result.dimensiones.inclusion, 5);
      assertEqual(result.dimensiones.buenTrato, 4);
      assertEqual(result.participantes, 2);
    }
  },
  {
    name: "umbrales de categoría 4,1 / 3,1 / 2,1",
    run() {
      assertEqual(categoryKeyFromAverage(4.1), "FORTALECIDA");
      assertEqual(categoryKeyFromAverage(4.09), "DESARROLLO");
      assertEqual(categoryKeyFromAverage(3.1), "DESARROLLO");
      assertEqual(categoryKeyFromAverage(3.09), "ALERTA");
      assertEqual(categoryKeyFromAverage(2.1), "ALERTA");
      assertEqual(categoryKeyFromAverage(2.09), "CRITICA");
      assertEqual(categoryKeyFromAverage(0), null);
    }
  },
  {
    name: "levelFromCourse reconoce básico y medio con tilde",
    run() {
      assertEqual(levelFromCourse("7° Básico A"), "7° Básico");
      assertEqual(levelFromCourse("4° Medio C"), "4° Medio");
      assertEqual(levelFromCourse("Curso especial"), "Otro");
      assertEqual(levelFromCourse(""), "Otro");
    }
  },
  {
    name: "isValidCourse acepta solo cursos de la lista",
    run() {
      assertTrue(isValidCourse("7° Básico A"));
      assertTrue(isValidCourse("4° Medio F"));
      assertTrue(!isValidCourse("7° Básico Z"));
      assertTrue(!isValidCourse(""));
    }
  },
  {
    name: "groupCoursesByLevel agrupa todos los cursos",
    run() {
      const groups = groupCoursesByLevel();
      assertEqual(groups.length, 6);
      const total = groups.reduce((sum, [, courses]) => sum + courses.length, 0);
      assertEqual(total, 35);
      assertEqual(groups[0][0], "7° Básico");
    }
  },
  {
    name: "latestByCourse conserva la medición más reciente",
    run() {
      const old = measurement({
        id: "1",
        fecha: "2026-01-10",
        curso: "7° Básico A",
        promedio: 3
      });
      const recent = measurement({
        id: "2",
        fecha: "2026-03-10",
        curso: "7° Básico A",
        promedio: 4
      });
      const other = measurement({
        id: "3",
        fecha: "2026-02-10",
        curso: "8° Básico A",
        promedio: 2.5
      });

      const latest = latestByCourse([old, recent, other]);
      assertEqual(latest.length, 2);
      assertEqual(latest.find(item => item.curso === "7° Básico A").id, "2");
    }
  },
  {
    name: "latestByCourse desempata por creadoEn",
    run() {
      const first = measurement({
        id: "1",
        fecha: "2026-03-10",
        curso: "7° Básico A",
        promedio: 3,
        creadoEn: "2026-03-10T10:00:00.000Z"
      });
      const second = measurement({
        id: "2",
        fecha: "2026-03-10",
        curso: "7° Básico A",
        promedio: 4,
        creadoEn: "2026-03-10T11:00:00.000Z"
      });

      const latest = latestByCourse([first, second]);
      assertEqual(latest[0].id, "2");
    }
  },
  {
    name: "buildSnapshot promedia la última medición por curso",
    run() {
      const rows = [
        measurement({ id: "1", fecha: "2026-03-01", curso: "7° Básico A", promedio: 3 }),
        measurement({ id: "2", fecha: "2026-02-01", curso: "7° Básico A", promedio: 1 }),
        measurement({ id: "3", fecha: "2026-03-01", curso: "8° Básico A", promedio: 5 })
      ];

      const snapshot = buildSnapshot(rows);
      assertEqual(snapshot.cursos, 2);
      assertEqual(snapshot.totalMediciones, 3);
      assertEqual(snapshot.promedio, 4);
      assertEqual(snapshot.categoria, "DESARROLLO");
      assertEqual(snapshot.alertas, 1);
      assertClose(snapshot.dimensiones.bienestar, 4);
    }
  },
  {
    name: "rankingByCourse separa mejores y cursos bajo 3,1",
    run() {
      const rows = [
        measurement({ id: "1", fecha: "2026-03-01", curso: "7° Básico A", promedio: 4.2 }),
        measurement({ id: "2", fecha: "2026-03-01", curso: "7° Básico B", promedio: 3.5 }),
        measurement({ id: "3", fecha: "2026-03-01", curso: "8° Básico A", promedio: 2.5 })
      ];

      const ranking = rankingByCourse(rows, 2);
      assertEqual(ranking.top.length, 2);
      assertEqual(ranking.top[0].curso, "7° Básico A");
      assertEqual(ranking.bottom.length, 1);
      assertEqual(ranking.bottom[0].curso, "8° Básico A");
    }
  },
  {
    name: "groupByLevel ordena los niveles y promedia sus cursos",
    run() {
      const rows = [
        measurement({ id: "1", fecha: "2026-03-01", curso: "7° Básico A", promedio: 3 }),
        measurement({ id: "2", fecha: "2026-03-01", curso: "7° Básico B", promedio: 5 }),
        measurement({ id: "3", fecha: "2026-03-01", curso: "8° Básico A", promedio: 2.5 })
      ];

      const levels = groupByLevel(rows);
      assertEqual(levels[0].nivel, "7° Básico");
      assertEqual(levels[0].cursos, 2);
      assertEqual(levels[0].promedio, 4);
      assertEqual(levels[1].nivel, "8° Básico");
      assertEqual(levels[1].promedio, 2.5);
    }
  },
  {
    name: "normalizeMeasurement acepta formato plano antiguo",
    run() {
      const normalized = normalizeMeasurement({
        Curso: "7° Básico A",
        Fecha: "2026-10-26",
        Promedio: 4.2,
        Categoria: "",
        Bienestar: 4.2,
        Inclusion: 4.1,
        BuenTrato: 4.3,
        Participacion: 4,
        Seguridad: 4.4,
        Pertenencia: 4.2,
        Relaciones: 4.2
      });

      assertEqual(normalized.curso, "7° Básico A");
      assertEqual(normalized.nivel, "7° Básico");
      assertEqual(normalized.promedio, 4.2);
      assertEqual(normalized.categoria, "FORTALECIDA");
      assertEqual(normalized.dimensiones.buenTrato, 4.3);
    }
  },
  {
    name: "normalizeMeasurement recalcula promedio si falta",
    run() {
      const normalized = normalizeMeasurement({
        curso: "7° Básico A",
        fecha: "2026-10-26",
        promedio: "",
        dimensiones: {
          bienestar: 3,
          inclusion: 3,
          buenTrato: 3,
          participacion: 3,
          seguridad: 3,
          pertenencia: 3,
          relaciones: 3
        }
      });

      assertEqual(normalized.promedio, 3);
      assertEqual(normalized.categoria, "ALERTA");
    }
  },
  {
    name: "validateSurveyInput valida curso, responsable y participantes",
    run() {
      const valid = validateSurveyInput({
        curso: "7° Básico A",
        responsable: "  Ana Pérez  ",
        participantes: "30"
      });

      assertTrue(valid.valid);
      assertEqual(valid.value.responsable, "Ana Pérez");
      assertEqual(valid.value.participantes, 30);

      const invalid = validateSurveyInput({
        curso: "Curso inventado",
        responsable: "",
        participantes: 0
      });

      assertTrue(!invalid.valid);
      assertTrue(Boolean(invalid.errors.curso));
      assertTrue(Boolean(invalid.errors.responsable));
      assertTrue(Boolean(invalid.errors.participantes));
    }
  },
  {
    name: "validateResponse exige las 7 dimensiones entre 1 y 5",
    run() {
      const valid = validateResponse(response([1, 2, 3, 4, 5, 1, 5]));
      assertTrue(valid.valid);

      const invalid = validateResponse({
        bienestar: 5,
        inclusion: 0,
        buenTrato: 6,
        participacion: 3
      });

      assertTrue(!invalid.valid);
      assertTrue(Boolean(invalid.errors.inclusion));
      assertTrue(Boolean(invalid.errors.buenTrato));
      assertTrue(Boolean(invalid.errors.seguridad));
    }
  },
  {
    name: "validateManualRows detecta filas incompletas",
    run() {
      const valid = validateManualRows([response([4, 4, 4, 4, 4, 4, 4])]);
      assertTrue(valid.valid);

      const incomplete = validateManualRows([
        response([4, 4, 4, 4, 4, 4, 4]),
        { bienestar: 3 }
      ]);

      assertTrue(!incomplete.valid);

      const empty = validateManualRows([]);
      assertTrue(!empty.valid);
    }
  },
  {
    name: "parseDate conserva el día sin corrimiento de zona horaria",
    run() {
      const date = parseDate("2026-10-26");
      assertEqual(date.getFullYear(), 2026);
      assertEqual(date.getMonth(), 9);
      assertEqual(date.getDate(), 26);
      assertEqual(toIsoDate(date), "2026-10-26");
    }
  },
  {
    name: "dateSortValue ordena fechas cronológicamente",
    run() {
      assertTrue(dateSortValue("2026-10-26") > dateSortValue("2026-10-25"));
      assertEqual(dateSortValue(""), 0);
    }
  },
  {
    name: "formatTodayLong usa día capitalizado y mes en minúscula",
    run() {
      assertEqual(formatTodayLong(new Date(2026, 9, 26)), "Lunes, 26 de octubre");
      assertEqual(formatTodayLong("2026-03-01"), "Domingo, 1 de marzo");
      assertEqual(formatTodayLong(""), "");
    }
  },
  {
    name: "toCsv escapa punto y coma y comillas",
    run() {
      const csv = toCsv(
        [{ curso: '7° "A"', promedio: 3.5 }],
        [
          { label: "Curso", key: "curso" },
          { label: "Promedio", key: "promedio" }
        ]
      );

      assertTrue(csv.startsWith("Curso;Promedio"));
      assertTrue(csv.includes('"7° ""A"""'));
      assertTrue(csv.includes("3.5"));
    }
  }
];
