"use strict";

// References to DOM elements
let inputJahr         = null;
let inputLand         = null;
let divTabelle        = null;
let tabelleBody       = null;
let spanAnzahlLaender = null;

let jahrAktuell = new Date().getFullYear();

const JAHR_MIN = 1900;


/**
 * Event handler called when the webpage has loaded.
 */
window.addEventListener( "load", async function () {

    inputJahr         = document.getElementById( "inputJahr"         );
    inputLand         = document.getElementById( "inputLand"         );
    tabelleBody       = document.getElementById( "tabelleBody"       );
    spanAnzahlLaender = document.getElementById( "spanAnzahlLaender" );

    if ( !inputJahr || !inputLand || !tabelleBody ) {

        this.alert( "Internal error: At least one HTML element could not be found." );
        return;
    }

    onButtonZuruecksetzen();

    const buttonSpeichern     = this.document.getElementById( "buttonSpeichern"     );
    const buttonZuruecksetzen = this.document.getElementById( "buttonZuruecksetzen" );

    buttonSpeichern.addEventListener(     "click", onButtonSpeichern     );
    buttonZuruecksetzen.addEventListener( "click", onButtonZuruecksetzen );

    await datenLaden();
});


/**
 * Load data from the database and display it in the table.
 */
async function datenLaden() {

    // Clear the table
    tabelleBody.innerHTML         = "";
    spanAnzahlLaender.textContent = "0";

    try {

        const laenderArray = await getAlleDatensaetze();

        for ( let i = 0; i < laenderArray.length; i++ ) {

            const id   = laenderArray[i].id;
            const jahr = laenderArray[i].jahr;
            const land = laenderArray[i].land;
            addTabellenZeile( id, jahr, land );
        }

        spanAnzahlLaender.textContent = laenderArray.length + "";
    }
    catch ( fehler ) {

        console.error( "Error loading the database:", fehler );
        alert( "Error loading the database." );
    }
}


/**
 * Event handler for the "Save" button.
 *
 * @param {object} event Event object
 */
async function onButtonSpeichern( event ) {

    event.preventDefault();

    const jahrString = inputJahr.value.trim();
    if ( !jahrString ) {

        alert( "No year entered." );
        return;
    }
    let jahrZahl = Number( jahrString );
    if ( jahrZahl < JAHR_MIN ) {

         alert( "The year is too far in the past." );
         return;
    }
    if ( jahrZahl > jahrAktuell ) {

         alert( "The year is in the future." );
         return;
    }

    const neuesLand = inputLand.value.trim();
    if ( neuesLand.length === 0 ) {

        alert( "Invalid entry: Country cannot be empty." );
        return;
    }

    try {

        await neuerDatensatz( jahrZahl, neuesLand );
        datenLaden();
    }
    catch ( fehler ) {

        console.error( "Error saving record:", fehler );
        alert( "Error saving the record." );
    }
}


/**
 * Event handler for the "Reset" button.
 *
 * @param {object} event Event object
 */
function onButtonZuruecksetzen( event ) {

    if ( event ) { event.preventDefault(); }

    inputJahr.value = jahrAktuell;
    inputLand.value = "";
}


/**
 * Insert a row into the table.
 *
 * @param {number} id Record ID
 *
 * @param {number} jahr Year of the first visit (must already be validated)
 *
 * @param {string} land Country, e.g. "France" (must already be validated)
 */
function addTabellenZeile( id, jahr, land ) {

    const tabellenZeileKnoten = document.createElement( "tr" );

    const zelleJahr        = document.createElement( "td" );
    const zelleLand        = document.createElement( "td" );
    const zelleLoeschen    = document.createElement( "td" );
    const zelleJahrAendern = document.createElement( "td" );
    const zelleLandAendern = document.createElement( "td" );

    zelleJahr.textContent = jahr + "";
    zelleLand.textContent = land;

    const loeschLink       = document.createElement( "a" );
    loeschLink.href        = "#";
    loeschLink.textContent = "Delete";
    loeschLink.addEventListener( "click", (event) => { onLoeschenKlick( event, id, land, jahr ); });
    zelleLoeschen.appendChild( loeschLink );

    const jaehrAenderLink       = document.createElement( "a" );
    jaehrAenderLink.href        = "#";
    jaehrAenderLink.textContent = "Edit year";
    jaehrAenderLink.addEventListener( "click", (event) => { onJahrAendernKlick( event, id, land, jahr ); });
    zelleJahrAendern.appendChild( jaehrAenderLink );

    const landAendernLink       = document.createElement( "a" );
    landAendernLink.href        = "#";
    landAendernLink.textContent = "Edit country";
    landAendernLink.addEventListener( "click", (event) => { onLandAendernKlick( event, id, land, jahr ); });
    zelleLandAendern.appendChild( landAendernLink );

    tabellenZeileKnoten.appendChild( zelleJahr        );
    tabellenZeileKnoten.appendChild( zelleLand        );
    tabellenZeileKnoten.appendChild( zelleLoeschen    );
    tabellenZeileKnoten.appendChild( zelleJahrAendern );
    tabellenZeileKnoten.appendChild( zelleLandAendern );

    tabelleBody.appendChild( tabellenZeileKnoten );
}


/**
 * Event handler for deleting a record.
 *
 * @param {object} event Event object
 *
 * @param {number} id ID of the record to delete
 *
 * @param {string} land Country, e.g. "France"
 *
 * @param {number} jahr Year of the first visit, e.g. 1986
 */
async function onLoeschenKlick( event, id, land, jahr ) {

    event.preventDefault();

    const bestaetigt = confirm( `Are you sure you want to delete the entry for "${land}" from ${jahr}?` );
    if ( bestaetigt === true ) {

        try {

            await loescheDatensatz( id );

            await datenLaden();
        }
        catch ( fehler ) {

            console.log( `Error deleting record with ID=${id}.`, id );
            alert( "Error deleting the record." );
        }
    }
}


/**
 * Event handler for changing a record's year.
 *
 * @param {object} event Event object
 *
 * @param {number} id ID of the record to delete
 *
 * @param {string} land Country, e.g. "France"
 *
 * @param {number} jahr Year of the first visit (to be changed)
 */
async function onJahrAendernKlick( event, id, land, jahr ) {

    event.preventDefault();

    const neueJahreszahlStr =
            prompt( `Enter the new year you visited "${land}":`,
                    jahr );

    if ( !neueJahreszahlStr ) { return; }

    const neueJahreszahlNumber = Number( neueJahreszahlStr );
    if ( !neueJahreszahlNumber ) {

        alert( "Invalid year entered." );
        return;
    }
    if ( neueJahreszahlNumber < JAHR_MIN ) {

        alert( "Error: The entered year is too far in the past." );
        return;
    }
    if ( neueJahreszahlNumber > jahrAktuell ) {

        alert( "Error: The entered year is in the future." );
        return;
    }

    try {

        await aendereDatensatz( id, neueJahreszahlNumber, null );

        await datenLaden();
    }
    catch ( fehler ) {

        console.log( `Error changing the year for record with ID=${id}.`, fehler );
        alert( "An error occurred while updating the record." );
    }
}


/**
 * Event handler for changing a record's country.
 *
 * @param {object} event Event object
 *
 * @param {number} id ID of the record to delete
 *
 * @param {string} land Country, e.g. "France"
 *
 * @param {number} jahr Year of the first visit (to be changed)
 */
async function onLandAendernKlick( event, id, land, jahr ) {

    event.preventDefault();

    let neuesLand = prompt( `Enter the new country for ${jahr}:`, land );
    if ( !neuesLand ) { return; }

    neuesLand = neuesLand.trim();

    if ( neuesLand.length === 0 ) {

        alert( "Error: No country entered." );
        return;
    }

    try {

        await aendereDatensatz( id, null, neuesLand );

        await datenLaden();
    }
    catch ( fehler ) {

        console.log( `Error changing the country for record with ID=${id}.`, fehler );
        alert( "An error occurred while updating the record." );
    }
}
