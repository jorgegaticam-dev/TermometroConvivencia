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