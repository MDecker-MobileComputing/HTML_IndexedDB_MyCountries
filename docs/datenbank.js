"use strict";

const DATENBANK_NAME        = "AlleMeineLaenderDB";
const STORE_LISTENEINTRAEGE = "laender";


/**
 * Verbindungsobjekt der Datenbank holen (Datenbank wird ggf. erstellt).
 *
 * @returns {Promise<IDBDatabase>} Promise auf Verbindungsobjekt der Datenbank
 */
function holeDatenbankVerbindung() {

    return new Promise( (resolve, reject) => {

        const idbOpenRequest = window.indexedDB.open( DATENBANK_NAME, 1 ); // Schema-Version

        idbOpenRequest.onsuccess = (event) => {

            const db = event.target.result;
            console.log( `Datenbank \"${DATENBANK_NAME}\" erfolgreich geöffnet.` );
            return resolve(db);
        };

        idbOpenRequest.onerror = (event) => {

            const fehlerObjekt = event.target.error;
            console.error( `Fehler beim Öffnen der Datenbank \"${DATENBANK_NAME}\":`, fehlerObjekt );
            return reject( fehlerObjekt );
        };

        idbOpenRequest.onupgradeneeded = (event) => {

            console.log( `Datenbank \"${DATENBANK_NAME}\" wird erstellt/aktualisiert.` );
            const db = event.target.result;

            // Object Store erstellen (falls noch nicht vorhanden)
            if ( !db.objectStoreNames.contains( STORE_LISTENEINTRAEGE ) ) {

                db.createObjectStore( STORE_LISTENEINTRAEGE, {
                    keyPath: "id",
                    autoIncrement: true
                });
                console.log( `Object Store \"${STORE_LISTENEINTRAEGE}\" erstellt.` );
            }
        };
    });
};


/**
 * Neues Land+Jahr in Datenbank speichern.
 * 
 * @param {number} jahr Jahreszahl (vierstellig, muss validiert sein)
 * 
 * @param {string} land Land (muss validiert sein)
 * 
 * @returns {Promise<number>} Promise mit ID der neu erstellten Lehrveranstaltung
 */
async function neuerDatensatz( jahr, land ) {

    const datenbank = await holeDatenbankVerbindung();

    return new Promise( ( resolve, reject ) => {

        const tx      = datenbank.transaction( STORE_LISTENEINTRAEGE, "readwrite" );
        const store   = tx.objectStore( STORE_LISTENEINTRAEGE );

        const landObjekt = { 
                             jahr: jahr, 
                             land: land
                           };

        const neuRequest = store.add( landObjekt );

        neuRequest.onsuccess = () => resolve( neuRequest.result );
        neuRequest.onerror   = () => reject(  neuRequest.error  );
    });    
}


/**
 * Alle gespeicherten Datensätze (Länder+Jahr) von Datenbank holen.
 * 
 * @returns {Promise<Array>} Promise mit Array aller Länderobjekt
 *                           aufsteigend nach Jahr sortiert
 */
async function getAlleDatensaetze() {

    const datenbank = await holeDatenbankVerbindung();

    return new Promise( ( resolve, reject ) => {

        const tx      = datenbank.transaction( STORE_LISTENEINTRAEGE, "readonly" );
        const store   = tx.objectStore( STORE_LISTENEINTRAEGE );

        const leseRequest = store.getAll();

        leseRequest.onsuccess = function() { 

            let laenderArray = leseRequest.result;
            laenderArray = laenderArray.sort( (a, b) => {
                return a.jahr - b.jahr;
            });
            resolve( laenderArray );

        };
        leseRequest.onerror = function() { reject(  request.error ); };
    });
}


/**
 * Löscht einen Datensatz in Datenbank.
 * 
 * @param {number} id  ID von Datensatz, der zu Löschen ist
 * 
 * @returns {Promise<void>} Promise, die resolved wenn der Löschvorgang erfolgreich war
 */
async function loescheDatensatz( id ) {

    const datenbank = await holeDatenbankVerbindung();    

    return new Promise( (resolve, reject) => {

        const tx    = datenbank.transaction( STORE_LISTENEINTRAEGE, "readwrite" );
        const store = tx.objectStore( STORE_LISTENEINTRAEGE );        

        const loeschRequest = store.delete( id );

        loeschRequest.onsuccess = function() { resolve();               }; 
        loeschRequest.onerror   = function() { reject( request.error ); };
    });
}


/**
 * Daten ändern; entweder `neuJahreszahl` oder `neuLand` muss gesetzt sein.
 * 
 * @param {number} id ID von zu änderndem Datensatz
 * 
 * @param {number} neuJahreszahl Neue Jahreszahl (Optional); muss schon validiert sein
 * 
 * @param {string} neuLand Neues Land (Optional); muss schon validiert sein
 * 
 * @returns {Promise<number>} Promise, die mit der ID des aktualisierten Eintrags resolved
 */
async function aendereDatensatz( id, neuJahreszahl, neuLand ) {

    if ( !neuJahreszahl && !neuLand ) {

        reject( new Error( "Weder neues Jahr noch neues Land übergeben." ));
    }

    const datenbank = await holeDatenbankVerbindung();

    return new Promise( (resolve, reject) => {

        const tx = datenbank.transaction( STORE_LISTENEINTRAEGE, "readwrite" );
        const store = tx.objectStore( STORE_LISTENEINTRAEGE );

        const leseRequest = store.get( id );

        leseRequest.onerror = function() { reject( leseRequest.error ); }

        leseRequest.onsuccess = function() {

            const datensatz = leseRequest.result;
            if ( !datensatz ) {

                reject( new Error( `Datensatz mit ID=${id} nicht gefunden.` ) );
                return;
            }

            if ( neuJahreszahl ) { datensatz.jahr = neuJahreszahl };
            if ( neuLand       ) { datensatz.land = neuLand       };

            const schreibRequest = store.put( datensatz );
            schreibRequest.onsuccess = function() { resolve( schreibRequest.result ); }
            schreibRequest.onerror   = function() { reject( schreibRequest.error   ); }
        }
    });
}
