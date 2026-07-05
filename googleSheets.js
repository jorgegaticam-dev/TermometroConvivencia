// ======================================
// CONFIGURACIÓN GOOGLE SHEETS
// ======================================

const URL_GOOGLE_SHEETS =
"https://script.google.com/macros/s/AKfycbzixuAqFDRXVHMzV5rm1WKdOGP2I8gTiCjlPBJ84KoSGTLgxh4tbCTxNFPj2JJyISWbgw/exec";

// ======================================
// GUARDAR MEDICIÓN
// ======================================

async function guardarEnGoogleSheets(datos){

    try{

        console.log("Enviando:", datos);

        const respuesta = await fetch(URL_GOOGLE_SHEETS,{
            method:"POST",
            body:JSON.stringify(datos)
        });

        const texto = await respuesta.text();

        console.log("Respuesta:", texto);

    }

    catch(error){

        console.error(error);

    }

}

// ======================================
// LEER MEDICIONES DESDE GOOGLE SHEETS
// ======================================

async function cargarDesdeGoogleSheets(){

    try{

        const respuesta = await fetch(URL_GOOGLE_SHEETS);

        const datos = await respuesta.json();

        mediciones = datos.map(m => ({

            id: m["ID"],

            fecha: m["Fecha"],

            curso: m["Curso"],

            responsable: m["Responsable"],

            participantes: Number(m["Participantes"]),

            promedio: Number(m["Promedio"]),

            categoria: m["Categoría"],

            dimensiones:{

                bienestar: Number(m["Bienestar"]),

                inclusion: Number(m["Inclusión"]),

                buenTrato: Number(m["Buen Trato"]),

                participacion: Number(m["Participación"]),

                seguridad: Number(m["Seguridad"]),

                pertenencia: Number(m["Pertenencia"]),

                relaciones: Number(m["Relaciones"])

            }

        }));

        console.log("Mediciones cargadas:", mediciones);

    }

    catch(error){

        console.error("Error al leer Google Sheets:", error);

    }

}