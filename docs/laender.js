"use strict";


let inputJahr = null;
let inputLand = null;

let divTabelle  = null;
let tabelleBody = null;

let jahrAktuell = new Date().getFullYear();


/**
 * Event-Handler, der aufgerufen wird, wenn die Webseite geladen wurde.
 */
window.addEventListener( "load", async function () {

    inputJahr   = document.getElementById( "inputJahr"   );
    inputLand   = document.getElementById( "inputLand"   );
    tabelleBody = document.getElementById( "tabelleBody" );

    if ( !inputJahr || !inputLand || !tabelleBody ) {

        this.alert( "Interner Fehler: Mindestens eines der HTML-Elemente wurde nicht gefunden." );
        return;
    }
    
    onButtonZuruecksetzen();

    const buttonSpeichern     = this.document.getElementById( "buttonSpeichern"     );
    const buttonZuruecksetzen = this.document.getElementById( "buttonZuruecksetzen" );

    buttonSpeichern.addEventListener(     "click", onButtonSpeichern     );
    buttonZuruecksetzen.addEventListener( "click", onButtonZuruecksetzen );
});


/**
 * Event-Handler für den Button "Speichern".
 */
function onButtonSpeichern( event ) {

    event.preventDefault();

    const jahr = inputJahr.value.trim();
    if ( !jahr ) {

        alert( "Keine Jahreszahl eingegeben." );
        return;
    }
    if ( jahr < 1900 ) {

         alert( "Jahreszahl liegt zu weit in der Vergangenheit." );
         return;
    }
    if ( jahr > jahrAktuell ) {

         alert( "Jahreszahl liegt in der Zukunft." );
         return;
    }

    const neuesLand = inputLand.value.trim();
    if ( neuesLand.length === 0 ) {

        alert( "Ungültige Eingabe: Leeres Land." );
        return;
    }


    addTabellenZeile( jahr, neuesLand );
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
 * @param {number} jahr Jahreszahl Erstbesuch (muss schon validiert sein)
 * 
 * @param {string} land Land, z.B. "Frankreich" (muss schon validiert sein)
 */
function addTabellenZeile( jahr, land ) {

    const tabellenZeileKnoten = document.createElement( "tr" );
        
    const zelleJahr = document.createElement( "td" );
    const zelleLand = document.createElement( "td" );

    zelleJahr.textContent = jahr + "";
    zelleLand.textContent = land;

    tabellenZeileKnoten.appendChild( zelleJahr );
    tabellenZeileKnoten.appendChild( zelleLand );
    tabelleBody.appendChild( tabellenZeileKnoten );
}
