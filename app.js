// ======================================
// TERMÓMETRO DE LA CONVIVENCIA EDUCATIVA
// FASE 1 - VERSIÓN INICIAL
// ======================================

// Obtener elementos de la página

const guardarBtn = document.getElementById("guardarBtn");

const curso = document.getElementById("curso");
const responsable = document.getElementById("responsable");
const participantes = document.getElementById("participantes");

const promedioInstitucional =
document.getElementById("promedioInstitucional");

const cursosEvaluados =
document.getElementById("cursosEvaluados");

const alertas =
document.getElementById("alertas");

const resultadoCategoria =
document.getElementById("resultadoCategoria");

const nivel =
document.getElementById("nivel");

let graficoEvolucion = null;

let radarSeguimiento = null;

// ======================================
// FILTROS HISTORIAL
// ======================================

const buscarCurso =
document.getElementById("buscarCurso");

const filtroNivel =
document.getElementById("filtroNivel");

const filtroCurso =
document.getElementById("filtroCurso");

const filtroMes =
document.getElementById("filtroMes");

const filtroAnio =
document.getElementById("filtroAnio");

const filtroFecha =
document.getElementById("filtroFecha");

const filtroCategoria =
document.getElementById("filtroCategoria");

const limpiarFiltros =
document.getElementById("limpiarFiltros");

// ======================================
// Guardado de infromacion
// ======================================

let mediciones = [];
JSON.parse(localStorage.getItem("TCE_RESULTADOS")) || [];

// ======================================
// FORMATEAR FECHA
// ======================================

function formatearFecha(fecha){

    const meses = {

        "01":"Enero",
        "02":"Febrero",
        "03":"Marzo",
        "04":"Abril",
        "05":"Mayo",
        "06":"Junio",
        "07":"Julio",
        "08":"Agosto",
        "09":"Septiembre",
        "10":"Octubre",
        "11":"Noviembre",
        "12":"Diciembre"

    };

    const partes =
    fecha.split("-");

    const dia =
    partes[0];

    const mes =
    meses[partes[1]];

    const anio =
    partes[2];

    return `${dia} de ${mes} de ${anio}`;

}

// ======================================
// CARGAR CURSOS EN FILTRO
// ======================================

function cargarCursosFiltro(){

    const cursosUnicos =
    [...new Set(
        mediciones.map(m => m.curso)
    )];

    filtroCurso.innerHTML = `
        <option value="">
            Todos los cursos
        </option>
    `;

    cursosUnicos.forEach(curso => {

        filtroCurso.innerHTML += `
            <option value="${curso}">
                ${curso}
            </option>
        `;

    });

}

// ======================================
// CARGAR AÑOS EN FILTRO
// ======================================

function cargarAniosFiltro(){

    const aniosUnicos =
    [...new Set(

        mediciones.map(m =>

            m.fecha.split("-")[2]

        )

    )];

    filtroAnio.innerHTML = `
        <option value="">
            Todos los años
        </option>
    `;

    aniosUnicos
    .sort()
    .forEach(anio => {

        filtroAnio.innerHTML += `
            <option value="${anio}">
                ${anio}
            </option>
        `;

    });

}

// ======================================
// GUARDAR MEDICIÓN
// ======================================

guardarBtn.addEventListener("click", () => {

    if(responsable.value.trim() === ""){

        alert("Ingrese responsable");

        return;
    }

    if(participantes.value === ""){

        alert("Ingrese cantidad de participantes");

        return;
    }

    // Simulación de promedio
    // Más adelante será calculado desde encuesta real

    // Obtener respuestas de la encuesta

// ======================================
// LECTURA DE TABLA MASIVA
// ======================================

const filas =
contenedorTabla.querySelectorAll("tbody tr");

if(filas.length === 0){

    alert(
        "Debe generar la tabla de estudiantes."
    );

    return;
}

let sumaBienestar = 0;
let sumaInclusion = 0;
let sumaBuenTrato = 0;
let sumaParticipacion = 0;
let sumaSeguridad = 0;
let sumaPertenencia = 0;
let sumaRelaciones = 0;

let estudiantes = [];

for(const fila of filas){

    const inputs =
    fila.querySelectorAll("input");

    const bienestar =
    Number(inputs[0].value);

    const inclusion =
    Number(inputs[1].value);

    const buenTrato =
    Number(inputs[2].value);

    const participacion =
    Number(inputs[3].value);

    const seguridad =
    Number(inputs[4].value);

    const pertenencia =
    Number(inputs[5].value);

    const relaciones =
    Number(inputs[6].value);

    const respuestas =
    [
        bienestar,
        inclusion,
        buenTrato,
        participacion,
        seguridad,
        pertenencia,
        relaciones
    ];

    const invalida =
    respuestas.some(valor =>
        valor < 1 ||
        valor > 5 ||
        isNaN(valor)
    );

    if(invalida){

        alert(
            "Existen respuestas vacías o fuera del rango 1 a 5."
        );

        return;
    }

    estudiantes.push({

        bienestar,
        inclusion,
        buenTrato,
        participacion,
        seguridad,
        pertenencia,
        relaciones

    });

    sumaBienestar += bienestar;
    sumaInclusion += inclusion;
    sumaBuenTrato += buenTrato;
    sumaParticipacion += participacion;
    sumaSeguridad += seguridad;
    sumaPertenencia += pertenencia;
    sumaRelaciones += relaciones;
}

const total =
filas.length;

const promedioBienestar =
sumaBienestar / total;

const promedioInclusion =
sumaInclusion / total;

const promedioBuenTrato =
sumaBuenTrato / total;

const promedioParticipacion =
sumaParticipacion / total;

const promedioSeguridad =
sumaSeguridad / total;

const promedioPertenencia =
sumaPertenencia / total;

const promedioRelaciones =
sumaRelaciones / total;

let promedio =

(
    promedioBienestar +
    promedioInclusion +
    promedioBuenTrato +
    promedioParticipacion +
    promedioSeguridad +
    promedioPertenencia +
    promedioRelaciones
)
/7;

    let categoria = obtenerCategoria(promedio);

   let nuevaMedicion = {

    fecha: new Date().toLocaleDateString(),

    curso: curso.value,

    responsable: responsable.value,

    participantes: participantes.value,

   estudiantes: estudiantes,

dimensiones: {

    bienestar:
    promedioBienestar.toFixed(2),

    inclusion:
    promedioInclusion.toFixed(2),

    buenTrato:
    promedioBuenTrato.toFixed(2),

    participacion:
    promedioParticipacion.toFixed(2),

    seguridad:
    promedioSeguridad.toFixed(2),

    pertenencia:
    promedioPertenencia.toFixed(2),

    relaciones:
    promedioRelaciones.toFixed(2)

},

    promedio: promedio,

    categoria: categoria

};

   mediciones.push(nuevaMedicion);

localStorage.setItem(
    "TCE_RESULTADOS",
    JSON.stringify(mediciones)
);

guardarEnGoogleSheets({

    fecha: nuevaMedicion.fecha,

    curso: nuevaMedicion.curso,

    responsable: nuevaMedicion.responsable,

    participantes: nuevaMedicion.participantes,

    promedio: nuevaMedicion.promedio,

    categoria: nuevaMedicion.categoria,

    bienestar: nuevaMedicion.dimensiones.bienestar,

    inclusion: nuevaMedicion.dimensiones.inclusion,

    buenTrato: nuevaMedicion.dimensiones.buenTrato,

    participacion: nuevaMedicion.dimensiones.participacion,

    seguridad: nuevaMedicion.dimensiones.seguridad,

    pertenencia: nuevaMedicion.dimensiones.pertenencia,

    relaciones: nuevaMedicion.dimensiones.relaciones

});

// Actualizar datos
cargarCursosFiltro();
cargarAniosFiltro();
cargarHistorial();
actualizarDashboard();

// Actualizar visualizaciones
actualizarTermometro(promedio);

mostrarDimensiones({

    bienestar:
    promedioBienestar.toFixed(2),

    inclusion:
    promedioInclusion.toFixed(2),

    buenTrato:
    promedioBuenTrato.toFixed(2),

    participacion:
    promedioParticipacion.toFixed(2),

    seguridad:
    promedioSeguridad.toFixed(2),

    pertenencia:
    promedioPertenencia.toFixed(2),

    relaciones:
    promedioRelaciones.toFixed(2)

});

const diagnostico =
analizarDimensiones({

    bienestar:
    promedioBienestar,

    inclusion:
    promedioInclusion,

    buenTrato:
    promedioBuenTrato,

    participacion:
    promedioParticipacion,

    seguridad:
    promedioSeguridad,

    pertenencia:
    promedioPertenencia,

    relaciones:
    promedioRelaciones

});

const alertaDimensiones =
document.getElementById(
    "alertaDimensiones"
);

let htmlDiagnostico = "";

if(diagnostico.criticas.length > 0){

    htmlDiagnostico +=
    "<h4>⚠ Dimensiones Prioritarias</h4><br>";

    htmlDiagnostico +=
    diagnostico.criticas.join("<br><br>");

}

if(diagnostico.fortalezas.length > 0){

    htmlDiagnostico +=
    "<br><br><h4>✅ Fortalezas Detectadas</h4><br>";

    htmlDiagnostico +=
    diagnostico.fortalezas.join("<br>");

}

if(
    diagnostico.criticas.length === 0 &&
    diagnostico.fortalezas.length === 0
){

    htmlDiagnostico =
    "Sin diagnóstico disponible.";

}

alertaDimensiones.innerHTML =
htmlDiagnostico;

const riesgo =
calcularIndiceRiesgo(
    promedio,
    diagnostico.criticas.length
);

document.getElementById(
    "indiceRiesgo"
).innerHTML =

`<h4>${riesgo.nivel}</h4>
<p>${riesgo.mensaje}</p>`;

    alert(
        "Medición guardada correctamente.\n\nPromedio: "
        + promedio +
        "\nCategoría: " +
        categoria
    );

});

// ======================================
// CATEGORÍAS
// ======================================

function obtenerCategoria(promedio){

    if(promedio >= 4.1){

        return "🟢 Convivencia Fortalecida";

    }

    if(promedio >= 3.1){

        return "🟡 Convivencia en Desarrollo";

    }

    if(promedio >= 2.1){

        return "🟠 Convivencia en Alerta";

    }

    return "🔴 Convivencia Crítica";

}

// ======================================
// TERMÓMETRO
// ======================================

function actualizarTermometro(promedio){

    let porcentaje =
    (promedio / 5) * 100;

    nivel.style.height =
    porcentaje + "%";

    if(promedio >= 4.1){

        nivel.style.background =
        "#22c55e";

    }
    else if(promedio >= 3.1){

        nivel.style.background =
        "#eab308";

    }
    else if(promedio >= 2.1){

        nivel.style.background =
        "#f97316";

    }
    else{

        nivel.style.background =
        "#ef4444";

    }

    resultadoCategoria.innerText =
    obtenerCategoria(promedio);

    document.getElementById(
        "promedioTermometro"
    ).innerText =
    promedio.toFixed(2);

    const info =
    obtenerInterpretacion(promedio);

    document.getElementById(
        "interpretacion"
    ).innerText =
    info.interpretacion;

    document.getElementById(
        "recomendacion"
    ).innerText =
    info.recomendacion;

}

function obtenerInterpretacion(promedio){

    if(promedio >= 4.1){

        return {

            interpretacion:
            "El curso presenta altos niveles de bienestar, inclusión y relaciones positivas.",

            recomendacion:
            "Mantener las estrategias actuales y fortalecer el liderazgo positivo del curso."

        };

    }

    if(promedio >= 3.1){

        return {

            interpretacion:
            "Existen condiciones favorables, aunque se observan oportunidades de mejora.",

            recomendacion:
            "Fortalecer la participación estudiantil y el sentido de pertenencia."

        };

    }

    if(promedio >= 2.1){

        return {

            interpretacion:
            "Se observan señales de deterioro en algunos ámbitos de la convivencia.",

            recomendacion:
            "Implementar acciones focalizadas de acompañamiento y monitoreo."

        };

    }

    return {

        interpretacion:
        "Existen dificultades significativas que requieren intervención prioritaria.",

        recomendacion:
        "Diseñar un plan intensivo de apoyo y seguimiento permanente."

    };

}

function analizarDimensiones(datos){

    let criticas = [];
    let fortalezas = [];

    if(datos.bienestar < 3){

        criticas.push(
            `Bienestar (${datos.bienestar.toFixed(2)})<br>
            → Fortalecer acciones de apoyo socioemocional.`
        );

    }
    else if(datos.bienestar >= 4){

        fortalezas.push(
            `Bienestar (${datos.bienestar.toFixed(2)})`
        );

    }

    if(datos.inclusion < 3){

        criticas.push(
            `Inclusión (${datos.inclusion.toFixed(2)})<br>
            → Promover estrategias de integración y respeto por la diversidad.`
        );

    }
    else if(datos.inclusion >= 4){

        fortalezas.push(
            `Inclusión (${datos.inclusion.toFixed(2)})`
        );

    }

    if(datos.buenTrato < 3){

        criticas.push(
            `Buen Trato (${datos.buenTrato.toFixed(2)})<br>
            → Reforzar campañas y acciones de convivencia respetuosa.`
        );

    }
    else if(datos.buenTrato >= 4){

        fortalezas.push(
            `Buen Trato (${datos.buenTrato.toFixed(2)})`
        );

    }

    if(datos.participacion < 3){

        criticas.push(
            `Participación (${datos.participacion.toFixed(2)})<br>
            → Incrementar espacios de voz y protagonismo estudiantil.`
        );

    }
    else if(datos.participacion >= 4){

        fortalezas.push(
            `Participación (${datos.participacion.toFixed(2)})`
        );

    }

    if(datos.seguridad < 3){

        criticas.push(
            `Seguridad (${datos.seguridad.toFixed(2)})<br>
            → Fortalecer acciones preventivas y monitoreo de la percepción de seguridad.`
        );

    }
    else if(datos.seguridad >= 4){

        fortalezas.push(
            `Seguridad (${datos.seguridad.toFixed(2)})`
        );

    }

    if(datos.pertenencia < 3){

        criticas.push(
            `Pertenencia (${datos.pertenencia.toFixed(2)})<br>
            → Potenciar identidad de curso y sentido de comunidad.`
        );

    }
    else if(datos.pertenencia >= 4){

        fortalezas.push(
            `Pertenencia (${datos.pertenencia.toFixed(2)})`
        );

    }

    if(datos.relaciones < 3){

        criticas.push(
            `Relaciones (${datos.relaciones.toFixed(2)})<br>
            → Fortalecer vínculos positivos y trabajo colaborativo.`
        );

    }
    else if(datos.relaciones >= 4){

        fortalezas.push(
            `Relaciones (${datos.relaciones.toFixed(2)})`
        );

    }

    return {
        criticas,
        fortalezas
    };

}

function calcularIndiceRiesgo(
    promedio,
    cantidadCriticas
){

    if(
        promedio >= 4 &&
        cantidadCriticas === 0
    ){

        return {

            nivel:
            "🟢 Riesgo Bajo",

            mensaje:
            "El curso presenta condiciones favorables de convivencia y no requiere intervención prioritaria."

        };

    }

    if(
        promedio >= 3 &&
        cantidadCriticas <= 2
    ){

        return {

            nivel:
            "🟡 Riesgo Moderado",

            mensaje:
            "Se observan algunas dimensiones que requieren monitoreo preventivo."

        };

    }

    if(
        promedio >= 2 &&
        cantidadCriticas <= 4
    ){

        return {

            nivel:
            "🟠 Riesgo Alto",

            mensaje:
            "Existen múltiples factores de riesgo que justifican acompañamiento focalizado."

        };

    }

    return {

        nivel:
        "🔴 Riesgo Crítico",

        mensaje:
        "Se recomienda intervención prioritaria y seguimiento sistemático del curso."

    };

}

// ======================================
// Mostrar Dimensiones
// ======================================

function obtenerColorPromedio(valor){

    valor = Number(valor);

    if(valor >= 4.1){

        return "#16A34A"; // Verde

    }

    if(valor >= 3.1){

        return "#EAB308"; // Amarillo

    }

    if(valor >= 2.1){

        return "#EA580C"; // Naranja

    }

    return "#DC2626"; // Rojo

}

function mostrarDimensiones(datos){

    const dimensiones = {

        resBienestar: datos.bienestar,
        resInclusion: datos.inclusion,
        resBuenTrato: datos.buenTrato,
        resParticipacion: datos.participacion,
        resSeguridad: datos.seguridad,
        resPertenencia: datos.pertenencia,
        resRelaciones: datos.relaciones

    };

    for(const id in dimensiones){

        const celda = document.getElementById(id);

        const valor = dimensiones[id];

        celda.innerText = valor;

        celda.style.color = obtenerColorPromedio(valor);

        celda.style.fontWeight = "700";

        celda.style.fontSize = "20px";

    }

}

// ======================================
// HISTORIAL
// ======================================

function cargarHistorial(){

    const historialBody =
    document.getElementById(
        "historialBody"
    );

    historialBody.innerHTML = "";

    mediciones.forEach(medicion => {

        historialBody.innerHTML += `

        <tr>

            <td>${formatearFecha(medicion.fecha)}</td>

            <td>${medicion.curso}</td>

            <td>${medicion.responsable}</td>

            <td>${medicion.participantes}</td>

            <td>${medicion.promedio}</td>

            <td>${medicion.categoria}</td>

        </tr>

        `;

    });

}

// ======================================
// FILTROS HISTORIAL
// ======================================

function aplicarFiltros(){

    const historialBody =
    document.getElementById("historialBody");

    let resultados =
    [...mediciones];

    const texto =
    buscarCurso.value.toLowerCase();

    const nivel =
    filtroNivel.value;

    const cursoSeleccionado =
    filtroCurso.value;

    const mes =
    filtroMes.value;

    const anio =
    filtroAnio.value;

    const fechaSeleccionada =
    filtroFecha.value;

    const categoria =
    filtroCategoria.value;

    // =====================
    // BUSCADOR
    // =====================

    if(texto){

        resultados =
        resultados.filter(m =>

            m.curso
            .toLowerCase()
            .includes(texto)

        );

    }

    // =====================
    // NIVEL
    // =====================

    if(nivel){

        resultados =
        resultados.filter(m =>

            m.curso.startsWith(nivel)

        );

    }

    // =====================
    // CURSO
    // =====================

    if(cursoSeleccionado){

        resultados =
        resultados.filter(m =>

            m.curso === cursoSeleccionado

        );

    }

    // =====================
    // MES
    // =====================

    if(mes){

        resultados =
        resultados.filter(m =>

            m.fecha.split("-")[1] === mes

        );

    }

    // =====================
    // ANIO
    // =====================

if(anio){

    resultados =
    resultados.filter(m =>

        m.fecha.split("-")[2] === anio

    );

}

    // =====================
    // FECHA EXACTA
    // =====================

    if(fechaSeleccionada){

        const partes =
        fechaSeleccionada.split("-");

        const fechaFiltro =
        `${partes[2]}-${partes[1]}-${partes[0]}`;

        resultados =
        resultados.filter(m =>

            m.fecha === fechaFiltro

        );

    }

    // =====================
    // CATEGORÍA
    // =====================

    if(categoria){

        resultados =
        resultados.filter(m =>

            m.categoria === categoria

        );

    }

    // =====================
    // REDIBUJAR TABLA
    // =====================

  historialBody.innerHTML = "";

const cantidad =
resultados.length;

document.getElementById(
    "contadorResultados"
).innerText =

cantidad === 1

? "Mostrando 1 medición"

: `Mostrando ${cantidad} mediciones`;

resultados.forEach(m => {

        historialBody.innerHTML += `

        <tr>

            <td>${formatearFecha(m.fecha)}</td>

            <td>${m.curso}</td>

            <td>${m.responsable}</td>

            <td>${m.participantes}</td>

            <td>${m.promedio}</td>

            <td>${m.categoria}</td>

        </tr>

        `;

    });

}

// ======================================
// DASHBOARD
// ======================================

function actualizarDashboard(){

    cursosEvaluados.innerText =
    mediciones.length;

    if(mediciones.length === 0){

        promedioInstitucional.innerText =
        "0.0";

        return;
    }

    let suma = 0;

    mediciones.forEach(item => {

        suma += item.promedio;

    });

    let promedioGeneral =
    (suma / mediciones.length)
    .toFixed(2);

    promedioInstitucional.innerText =
    promedioGeneral;

    let cantidadAlertas =

    mediciones.filter(item =>
        item.promedio <= 3
    ).length;

    alertas.innerText =
    cantidadAlertas;

    actualizarGraficoInstitucional();

}

// ======================================
// Ranking Curso
// ======================================

function actualizarRankingInstitucional(){

    const contenedor =
    document.getElementById(
        "rankingCursos"
    );

    if(mediciones.length === 0){

        contenedor.innerHTML =
        "Sin mediciones registradas.";

        return;

    }

    const ordenados =
    [...mediciones]
    .sort(
        (a,b) =>
        b.promedio - a.promedio
    );

    const topCursos =
    ordenados.slice(0,5);

    const cursosCriticos =
    [...mediciones]
    .filter(m =>
        m.promedio < 3
    )
    .sort(
        (a,b) =>
        a.promedio - b.promedio
    )
    .slice(0,5);

    let html = "";

    html +=
    "<div class='seccion-ranking'>";

    html +=
    "<h3>🏆 Top Cursos</h3>";

    topCursos.forEach((curso,index)=>{

html += `

<div class="ranking-item top">

    <span class="ranking-curso">

        🏅 ${index + 1}. ${curso.curso}

    </span>

<span class="ranking-promedio">

    ${Number(curso.promedio).toFixed(2)}
    
</span>

</div>

`;

    });

    html += "</div>";

    html +=
    "<div class='seccion-ranking'>";

    html +=
    "<h3>🚨 Cursos Prioritarios</h3>";

    if(cursosCriticos.length === 0){

        html +=
        "No existen cursos prioritarios actualmente.";

    }
    else{

        cursosCriticos.forEach(curso=>{

html += `

<div class="ranking-item alerta">

    <span class="ranking-curso">

        ⚠️ ${curso.curso}

    </span>

<span class="ranking-promedio">

    ${Number(curso.promedio).toFixed(2)}

</span>

</div>

`;

        });

    }

    html += "</div>";

    contenedor.innerHTML =
    html;

}

/* ======================================
   Curso Evolucion
====================================== */

function cargarCursosEvolucion(){

    const select =
    document.getElementById(
        "cursoEvolucion"
    );

    const cursosUnicos =

    [...new Set(
        mediciones.map(
            m => m.curso
        )
    )];

    select.innerHTML =

    `<option value="">
        Seleccione un curso
    </option>`;

    cursosUnicos.forEach(curso => {

        select.innerHTML +=

        `<option value="${curso}">
            ${curso}
        </option>`;

    });

}

function mostrarEvolucionCurso(){

    const cursoSeleccionado =
    document.getElementById(
        "cursoEvolucion"
    ).value;

    const contenedor =
    document.getElementById(
        "evolucionCurso"
    );

    if(!cursoSeleccionado){

        contenedor.innerHTML =
        "Seleccione un curso.";

        return;

    }

    const datosCurso =

    mediciones.filter(
        m =>
        m.curso === cursoSeleccionado
    );

actualizarGraficoEvolucion(
    datosCurso
);

    if(datosCurso.length === 0){

        contenedor.innerHTML =
        "Sin registros.";

        return;

    }

    let html = "";

    datosCurso.forEach(registro => {

html += `

<div class="evolucion-item">

    <div>

        <small>Medición</small>

        <h4>${formatearFecha(registro.fecha)}</h4>

    </div>

    <div class="evolucion-promedio">

        ${registro.promedio}

    </div>

</div>

`;

    });

const ultima =
Number(
    datosCurso[
        datosCurso.length - 1
    ].promedio
);

let diferencia = 0;

if(datosCurso.length > 1){

    const anterior =
    Number(
        datosCurso[
            datosCurso.length - 2
        ].promedio
    );

    diferencia = ultima - anterior;

}

html += "<hr>";

if(datosCurso.length < 2){

    html +=
    `<strong>
    ℹ️ Solo existe una medición.
    </strong>`;

}
else if(diferencia > 0){

    html +=
    `<strong style="color:#16A34A;">
    📈 Variación respecto a la medición anterior:
    +${diferencia.toFixed(2)}
    </strong>`;

}
else if(diferencia < 0){

    html +=
    `<strong style="color:#DC2626;">
    📉 Variación respecto a la medición anterior:
    ${diferencia.toFixed(2)}
    </strong>`;

}
else{

    html +=
    `<strong style="color:#64748B;">
    ➖ Sin cambios respecto a la medición anterior.
    </strong>`;

}

    contenedor.innerHTML =
    html;

}

document.getElementById(
    "cursoEvolucion"
).addEventListener(
    "change",
    mostrarEvolucionCurso
);

function actualizarGraficoEvolucion(datosCurso){

    const canvas =
    document.getElementById(
        "graficoEvolucion"
    );

    if(!canvas) return;

    const ctx =
    canvas.getContext("2d");

    if(graficoEvolucion){

        graficoEvolucion.destroy();

    }

    const fechas =
    datosCurso.map(
        registro =>
        formatearFecha(
            registro.fecha
        )
    );

    const promedios =
    datosCurso.map(
        registro =>
        Number(
            registro.promedio
        )
    );

    graficoEvolucion =
    new Chart(ctx, {

        type: "line",

        data: {

            labels: fechas,

            datasets: [{

                label:
                "Promedio de Convivencia",

                data:
                promedios,

                borderColor:
                "#2563eb",

                backgroundColor:
                "rgba(37,99,235,.15)",

                borderWidth: 3,

                tension: 0.3,

                fill: true

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    display: true

                }

            },

            scales: {

                y: {

                    min: 1,

                    max: 5

                }

            }

        }

    });

}

// ======================================
//  Comparacion por nivel
// ======================================

function actualizarComparacionNiveles(){

    const contenedor =
    document.getElementById(
        "comparacionNiveles"
    );

    if(mediciones.length === 0){

        contenedor.innerHTML =
        "Sin mediciones registradas.";

        return;

    }

    const niveles = {

        "7° Básico": [],
        "8° Básico": [],
        "1° Medio": [],
        "2° Medio": [],
        "3° Medio": [],
        "4° Medio": []

    };

    mediciones.forEach(m => {

        for(const nivel in niveles){

            if(
                m.curso.startsWith(nivel)
            ){

                niveles[nivel].push(
                    Number(m.promedio)
                );

            }

        }

    });

    let html = "";

    for(const nivel in niveles){

        if(
            niveles[nivel].length === 0
        ){

            continue;

        }

        const promedioNivel =

        niveles[nivel].reduce(
            (a,b)=>a+b,0
        )

        /

        niveles[nivel].length;

        let icono = "🟢";

        if(promedioNivel < 4){

            icono = "🟡";

        }

        if(promedioNivel < 3){

            icono = "🟠";

        }

        if(promedioNivel < 2){

            icono = "🔴";

        }

        const porcentaje =
(promedioNivel / 5) * 100;

        let color = "#22c55e";

        if(promedioNivel < 4){
            color = "#eab308";
        }

        if(promedioNivel < 3){
            color = "#f97316";
        }

        if(promedioNivel < 2){
            color = "#ef4444";
        }

html += `

<div class="nivel-card">

    <div class="nivel-header">

        <span class="nivel-nombre">
            ${icono} ${nivel}
        </span>

        <span class="nivel-valor">
            ${promedioNivel.toFixed(2)}
        </span>

    </div>

    <div class="nivel-barra">

        <div
          class="nivel-progreso"
          style="
          width:${porcentaje}%;
          background:${color};
        "
        ></div>

    </div>

</div>

`;

    }

    contenedor.innerHTML =
    html;

}

// ======================================
// GRÁFICO INSTITUCIONAL
// ======================================

let graficoInstitucional = null;

function actualizarGraficoInstitucional(){

    const ctx =
    document.getElementById(
        "graficoInstitucional"
    );

    if(!ctx) return;

    if(mediciones.length === 0) return;

    let sumaBuenTrato = 0;
    let sumaParticipacion = 0;
    let sumaSeguridad = 0;
    let sumaPertenencia = 0;
    let sumaRelaciones = 0;

    mediciones.forEach(m => {

        sumaBuenTrato +=
        Number(m.dimensiones.buenTrato);

        sumaParticipacion +=
        Number(m.dimensiones.participacion);

        sumaSeguridad +=
        Number(m.dimensiones.seguridad);

        sumaPertenencia +=
        Number(m.dimensiones.pertenencia);

        sumaRelaciones +=
        Number(m.dimensiones.relaciones);

    });

    const total =
    mediciones.length;

    const datos = [

        (sumaBuenTrato / total).toFixed(2),
        (sumaParticipacion / total).toFixed(2),
        (sumaSeguridad / total).toFixed(2),
        (sumaPertenencia / total).toFixed(2),
        (sumaRelaciones / total).toFixed(2)

    ];

const colores = datos.map(valor => {

    valor = Number(valor);

    if(valor >= 4.1){

        return "#2E7D32";

    }

    if(valor >= 3.1){

        return "#D4A94C";

    }

    if(valor >= 2.1){

        return "#F57C00";

    }

    return "#D32F2F";

});

    if(graficoInstitucional){

        graficoInstitucional.destroy();

    }

    graficoInstitucional =
    new Chart(ctx, {

        type: "bar",

        data: {

            labels: [

                "Buen Trato",
                "Participación",
                "Seguridad",
                "Pertenencia",
                "Relaciones"

            ],

            datasets: [{

                label:
                "Promedio Institucional",

                data: datos,

                backgroundColor: colores,

                borderRadius: 18,
                borderSkipped: false,
                maxBarThickness: 90,

                datalabels: {

                    anchor: "end",

                    align: "top",

                    color: "#16324F",

                    font: {

                        size: 14,

                        weight: "bold"

                    },


                    formatter: function(value){

                        return Number(value).toFixed(2);

                    }

                }
                
            }]

        },

        plugins: [ChartDataLabels],

        options: {

            responsive: true,

            maintainAspectRatio: false,

            animation: {

                duration: 1800,

                easing: "easeOutQuart"

            },

plugins: {

    legend: {

        display: false

    },

    tooltip: {

        backgroundColor: "#16324F",

        titleColor: "#FFFFFF",

        bodyColor: "#FFFFFF",

        padding: 12

    }

},

scales: {

    y: {

        min: 0,

        max: 5,

        ticks: {

            stepSize: 1,

            color: "#64748B",

            font: {

                size: 13

            }

        },

        grid: {

    color: "rgba(100,116,139,.12)",

    drawBorder: false

},

    },

    x: {

        ticks: {

            color: "#475569",

            font: {

                size: 13,

                weight: "bold"

            }

        },

        grid: {

            display: false

        }

    }

}

        }

    });

}

// ======================================
// CARGA INICIAL
// ======================================

async function iniciarAplicacion(){

    await cargarDesdeGoogleSheets();

    actualizarDashboard();

    actualizarRankingInstitucional();

    actualizarComparacionNiveles();

    cargarCursosEvolucion();

    cargarCursosSeguimiento();

    cargarCursosFiltro();

    cargarAniosFiltro();

    cargarHistorial();

    aplicarFiltros();

    if(mediciones.length > 0){

    const ultimaMedicion =
    mediciones[mediciones.length - 1];

    actualizarTermometro(
        Number(ultimaMedicion.promedio)
    );

    if(ultimaMedicion.dimensiones){

        mostrarDimensiones(
            ultimaMedicion.dimensiones
        );

    }

}

}

iniciarAplicacion();

// ======================================
// RECUPERAR ÚLTIMA MEDICIÓN
// ======================================



// ======================================
// TABLA MASIVA DE ESTUDIANTES
// ======================================

const crearTablaBtn =
document.getElementById("crearTablaBtn");

const contenedorTabla =
document.getElementById("contenedorTabla");

crearTablaBtn.addEventListener("click", () => {

console.log("BOTON PRESIONADO");

    const cantidad =
    Number(participantes.value);

    if(
        isNaN(cantidad) ||
        cantidad <= 0
    ){

        alert(
            "Ingrese primero la cantidad de estudiantes."
        );

        return;
    }

    let html = `
    <table border="1" style="width:100%; border-collapse:collapse;">
        <thead>
            <tr>
                <th>Estudiante</th>
                <th>Bienestar</th>
                <th>Inclusión</th>
                <th>Buen Trato</th>
                <th>Participación</th>
                <th>Seguridad</th>
                <th>Pertenencia</th>
                <th>Relaciones</th>
            </tr>
        </thead>
        <tbody>
    `;

    for(let i = 1; i <= cantidad; i++){

        html += `
        <tr>

            <td>${i}</td>

            <td><input type="number" min="1" max="5"></td>

            <td><input type="number" min="1" max="5"></td>

            <td><input type="number" min="1" max="5"></td>

            <td><input type="number" min="1" max="5"></td>

            <td><input type="number" min="1" max="5"></td>

            <td><input type="number" min="1" max="5"></td>

            <td><input type="number" min="1" max="5"></td>

        </tr>
        `;
    }

    html += `
        </tbody>
    </table>
    `;

    contenedorTabla.innerHTML =
    html;

});

// ======================================
// EVENTOS FILTROS
// ======================================

buscarCurso.addEventListener(
    "input",
    aplicarFiltros
);

filtroNivel.addEventListener(
    "change",
    aplicarFiltros
);

filtroCurso.addEventListener(
    "change",
    aplicarFiltros
);

filtroMes.addEventListener(
    "change",
    aplicarFiltros
);

filtroAnio.addEventListener(
    "change",
    aplicarFiltros
);

filtroFecha.addEventListener(
    "change",
    aplicarFiltros
);

filtroCategoria.addEventListener(
    "change",
    aplicarFiltros
);

// ======================================
// LIMPIAR FILTROS
// ======================================

limpiarFiltros.addEventListener(
    "click",
    () => {

        buscarCurso.value = "";

        filtroNivel.value = "";

        filtroCurso.value = "";

        filtroMes.value = "";

        filtroAnio.value = "";

        filtroFecha.value = "";

        filtroCategoria.value = "";

        aplicarFiltros();

    }
);

/* ======================================
   Menu de pestañas
====================================== */

function mostrarSeccion(id){

    document
    .querySelectorAll(".seccion")
    .forEach(seccion => {

        seccion.classList.add(
            "oculto"
        );

    });

    document
    .getElementById(id)
    .classList.remove(
        "oculto"
    );

    document
    .querySelectorAll(".tab-btn")
    .forEach(btn => {

        btn.classList.remove(
            "active"
        );

    });

    event.target.classList.add(
        "active"
    );

}

/* ======================================
   Cargar Cursos (Pestaña Seguimiento)
====================================== */

function cargarCursosSeguimiento(){

    const selector =
    document.getElementById(
        "cursoSeguimiento"
    );

    if(!selector) return;

    selector.innerHTML =

    `<option value="">
        Seleccione un curso
    </option>`;

    const cursos =

    [...new Set(
        mediciones.map(
            m => m.curso
        )
    )];

    cursos.sort();

    cursos.forEach(curso => {

        selector.innerHTML +=

        `<option value="${curso}">
            ${curso}
        </option>`;

    });

}

function mostrarFichaCurso(curso){

    const ficha =
    document.getElementById(
        "fichaCurso"
    );

    const datosCurso =

    mediciones.filter(
        m => m.curso === curso
    );

    if(datosCurso.length === 0){

        ficha.innerHTML =
        "No existen mediciones.";

        return;
    }

    const ultima =

    datosCurso[
        datosCurso.length - 1
    ];

    if(ultima.dimensiones){

    actualizarRadarSeguimiento(
        ultima.dimensiones
    );

    const promedioHistorico =

    datosCurso.reduce(

        (acc,m) =>

        acc +
        Number(m.promedio),

        0

    ) / datosCurso.length;

    ficha.innerHTML =

    `
<div class="ficha-grid">

    <div class="kpi">

        <span class="kpi-icono">📊</span>

        <h3>Promedio Actual</h3>

        <p>${ultima.promedio}</p>

    </div>

    <div class="kpi">

        <span class="kpi-icono">📈</span>

        <h3>Promedio Histórico</h3>

        <p>${promedioHistorico.toFixed(2)}</p>

    </div>

    <div class="kpi">

        <span class="kpi-icono">🏅</span>

        <h3>Categoría</h3>

        <p>${ultima.categoria.replace("Convivencia ","")}</p>

    </div>

    <div class="kpi">

        <span class="kpi-icono">📅</span>

        <h3>Última Medición</h3>

        <p>${ultima.fecha}</p>

    </div>

</div>

    <br>

    <strong>Responsable:</strong>
    ${ultima.responsable}

    <br><br>

    <strong>Total de mediciones:</strong>
    ${datosCurso.length}
    `;

}

}

document
.getElementById(
    "cursoSeguimiento"
)
.addEventListener(
    "change",
    function(){

        mostrarFichaCurso(
            this.value
        );

    }
);

// ======================================
// Grafico Radar Seguimiento
// ======================================

function actualizarRadarSeguimiento(dimensiones){

    const canvas =
    document.getElementById(
        "radarSeguimiento"
    );

    if(!canvas) return;

    const ctx =
    canvas.getContext("2d");

    if(radarSeguimiento){

        radarSeguimiento.destroy();

    }

    radarSeguimiento =
    new Chart(ctx, {

        type: "radar",

        data: {

            labels: [

                "Bienestar",
                "Inclusión",
                "Buen Trato",
                "Participación",
                "Seguridad",
                "Pertenencia",
                "Relaciones"

            ],

            datasets: [{

                label:
                "Perfil de Convivencia",

                data: [

                    Number(dimensiones.bienestar),
                    Number(dimensiones.inclusion),
                    Number(dimensiones.buenTrato),
                    Number(dimensiones.participacion),
                    Number(dimensiones.seguridad),
                    Number(dimensiones.pertenencia),
                    Number(dimensiones.relaciones)

                ],

                borderColor:
                "#2563eb",

                backgroundColor:
                "rgba(37,99,235,0.25)",

                borderWidth: 2

            }]

        },

        options: {

            responsive: true,

            scales: {

                r: {

                    min: 1,
                    max: 5,

                    ticks: {

                        stepSize: 1

                    }

                }

            }

        }

    });

}
