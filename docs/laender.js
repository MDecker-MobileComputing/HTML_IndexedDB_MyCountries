"use strict";


let inputJahr = null;
let inputLand = null;

let divTabelle = null;


/**
 * Event-Handler, der aufgerufen wird, wenn die Webseite geladen wurde.
 */
window.addEventListener( "load", async function () {

    inputJahr = document.getElementById( "inputJahr" );
    inputLand = document.getElementById( "inputLand" );

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
    if ( !jahr || jahr < 1900 || jahr > 2099 ) {
         alert( "Ungültige Eingabe für Jahreszahl." );
         return;
    }

    const neuesLand = inputLand.value.trim();
    if ( neuesLand.length === 0 ) {

        alert( "Ungültige Eingabe: Leeres Land." );
        return;
    }
}


/**
 * Event-Handler für den Button "Zurücksetzen".
 */
function onButtonZuruecksetzen( event ) {

    if ( event ) { event.preventDefault(); }

    const jahrAktuell = new Date().getFullYear();
    inputJahr.value = jahrAktuell;

    inputLand.value = "";
}