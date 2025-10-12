"use strict";

// Referenzen auf DOM-Elemente
let inputJahr         = null;
let inputLand         = null;
let divTabelle        = null;
let tabelleBody       = null;
let spanAnzahlLaender = null;

let jahrAktuell = new Date().getFullYear();

const JAHR_MIN = 1900;


/**
 * Event-Handler, der aufgerufen wird, wenn die Webseite geladen wurde.
 */
window.addEventListener( "load", async function () {

    inputJahr         = document.getElementById( "inputJahr"         );
    inputLand         = document.getElementById( "inputLand"         );
    tabelleBody       = document.getElementById( "tabelleBody"       );
    spanAnzahlLaender = document.getElementById( "spanAnzahlLaender" );

    if ( !inputJahr || !inputLand || !tabelleBody ) {

        this.alert( "Interner Fehler: Mindestens eines der HTML-Elemente wurde nicht gefunden." );
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
 * Daten von Datenbank laden und in Tabelle darstellen.
 */
async function datenLaden() {

    // Tabula Rasa
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
    
        console.error( "Fehler beim Laden vom Datenbank:", fehler );
        alert( "Fehler beim Laden vom Datenbank." );        
    }
}


/**
 * Event-Handler für den Button "Speichern".
 */
async function onButtonSpeichern( event ) {

    event.preventDefault();

    const jahrString = inputJahr.value.trim();
    if ( !jahrString ) {

        alert( "Keine Jahreszahl eingegeben." );
        return;
    }
    let jahrZahl = Number( jahrString );
    if ( jahrZahl < JAHR_MIN ) {

         alert( "Jahreszahl liegt zu weit in der Vergangenheit." );
         return;
    }
    if ( jahrZahl > jahrAktuell ) {

         alert( "Jahreszahl liegt in der Zukunft." );
         return;
    }

    const neuesLand = inputLand.value.trim();
    if ( neuesLand.length === 0 ) {

        alert( "Ungültige Eingabe: Leeres Land." );
        return;
    }

    try {

        await neuerDatensatz( jahrZahl, neuesLand );
        datenLaden();
    }
    catch ( fehler ) {

        console.error( "Fehler beim Speichern von Datensatz:", fehler );
        alert( "Fehler beim Speichern von Datensatz." );
    }    
}


/**
 * Event-Handler für den Button "Zurücksetzen".
 */
function onButtonZuruecksetzen( event ) {

    if ( event ) { event.preventDefault(); }
    
    inputJahr.value = jahrAktuell;
    inputLand.value = "";
}


/**
 * Zeile in Tabelle einfügen.
 * 
 * @param {number} id ID von Datensatz
 * 
 * @param {number} jahr Jahreszahl Erstbesuch (muss schon validiert sein)
 * 
 * @param {string} land Land, z.B. "Frankreich" (muss schon validiert sein)
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
    

    const loeschLink = document.createElement( "a" );
    loeschLink.href        = "#";
    loeschLink.textContent = "Löschen";
    loeschLink.addEventListener( "click", (event) => { onLoeschenKlick( event, id, land, jahr ); });
    zelleLoeschen.appendChild( loeschLink );

    const jaehrAenderLink = document.createElement( "a" );
    jaehrAenderLink.href        = "#";
    jaehrAenderLink.textContent = "Jahr ändern";
    jaehrAenderLink.addEventListener( "click", (event) => { onJahrAendernKlick( event, id, land, jahr ); });
    zelleJahrAendern.appendChild( jaehrAenderLink );
    
    tabellenZeileKnoten.appendChild( zelleJahr        );
    tabellenZeileKnoten.appendChild( zelleLand        );
    tabellenZeileKnoten.appendChild( zelleLoeschen    );
    tabellenZeileKnoten.appendChild( zelleJahrAendern );

    tabelleBody.appendChild( tabellenZeileKnoten );
}


/**
 * Event-Handler für Löschen eines Datensatzes.
 * 
 * @param {*} event Event-Objekt
 * 
 * @param {number} ID von zu löschendem Datensatz
 * 
 * @param {string} land Land, z.B. "Frankreich"
 * 
 * @param {number} jahr Jahreszahl Erstbesuch   
 */
async function onLoeschenKlick( event, id, land, jahr ) {

    event.preventDefault();

    const bestaetigt = confirm( `Soll der Eintrag für "${land}" im Jahr ${jahr} wirklich gelöscht werden?` );
    if ( bestaetigt === true ) {

        try {

            await loescheDatensatz( id );
            
            await datenLaden();
        }
        catch ( fehler ) {

            console.log( `Fehler beim Löschen von Datensatz mit ID=${id}.`, id );
            alert( "Fehler bei Löschen von Datensatz." );
        }        
    }
}


/**
 * Event-Handler für Ändern Jahreszahl eines Datensatzes.
 * 
 * @param {*} event Event-Objekt
 * 
 * @param {*} id ID von zu löschendem Datensatz
 * 
 * @param {*} land  Land, z.B. "Frankreich"
 * 
 * @param {*} jahr  Jahreszahl Erstbesuch (soll geändert werden)
 */
async function onJahrAendernKlick( event, id, land, jahr ) {

    event.preventDefault();

    const neueJahreszahlStr = prompt( `Bitte neue Jahreszahl für Besuch von "${land}" eingeben:`, jahr );
    if ( !neueJahreszahlStr ) { return; }
    
    const neueJahreszahlNumber = Number( neueJahreszahlStr );
    if ( !neueJahreszahlNumber ) {

        alert( "Ungültige Jahreszahl eingegeben." );
        return;
    }
    if ( neueJahreszahlNumber < JAHR_MIN ) {

        alert( "Fehler: Eingegebene Jahreszahl liegt zu weit in der Vergangenheit." );
        return;
    }
    if ( neueJahreszahlNumber > jahrAktuell ) {

        alert( "Fehler: Eingegebene Jahreszahl liegt in der Zukunft." );
        return;
    }

    try {

        await aendereDatensatz( id, neueJahreszahlNumber, null );

        await datenLaden();
    }
    catch ( fehler ) {

        console.log( `Fehler beim Ändern von Datensatz mit ID=${id}.`, fehler );
        alert( "Fehler bei Änderung von Datensatz aufgetreten." );
    }
}
