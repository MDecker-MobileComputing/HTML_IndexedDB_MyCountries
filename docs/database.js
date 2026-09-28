"use strict";

const DATENBANK_NAME        = "AlleMeineLaenderDB";
const STORE_LISTENEINTRAEGE = "laender";


/**
 * Get the database connection (create the database if necessary).
 *
 * @returns {Promise<IDBDatabase>} Promise for the database connection
 */
async function holeDatenbankVerbindung() {

    return new Promise( (resolve, reject) => {

        const idbOpenRequest = window.indexedDB.open( DATENBANK_NAME, 1 );

        idbOpenRequest.onsuccess = (event) => {

            const db = event.target.result;
            console.log( `Datenbank \"${DATENBANK_NAME}\" erfolgreich geöffnet.` );
            return resolve( db );
        };

        idbOpenRequest.onerror = (event) => {

            const fehler = event.target.error;
            console.error( `Fehler beim Öffnen der Datenbank \"${DATENBANK_NAME}\":`, fehler );
            return reject( fehler );
        };

        idbOpenRequest.onupgradeneeded = (event) => {

            console.log( `Datenbank \"${DATENBANK_NAME}\" wird erstellt/aktualisiert.` );
            const db = event.target.result;

            // Create the object store if it does not already exist
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
 * Save a new country and year in the database.
 *
 * @param {number} jahr Year (four digits; must already be validated)
 *
 * @param {string} land Country (must already be validated)
 *
 * @returns {Promise<number>} Promise containing the ID of the newly created record
 */
async function neuerDatensatz( jahr, land ) {

    const datenbank = await holeDatenbankVerbindung();

    return new Promise( ( resolve, reject ) => {

        const tx    = datenbank.transaction( STORE_LISTENEINTRAEGE, "readwrite" );
        const store = tx.objectStore( STORE_LISTENEINTRAEGE );

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
 * Get all saved records (countries and years) from the database.
 *
 * @returns {Promise<Array>} Promise containing an array of all country objects,
 *                           sorted by year in ascending order
 */
async function getAlleDatensaetze() {

    const datenbank = await holeDatenbankVerbindung();

    return new Promise( ( resolve, reject ) => {

        const tx    = datenbank.transaction( STORE_LISTENEINTRAEGE, "readonly" );
        const store = tx.objectStore( STORE_LISTENEINTRAEGE );

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
 * Delete a record from the database.
 *
 * @param {number} id ID of the record to delete
 *
 * @returns {Promise<void>} Promise fulfilled when the deletion succeeds
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
 * Update a record; either `neuJahreszahl` or `neuLand` must be provided.
 *
 * @param {number} id ID of the record to update
 *
 * @param {number} neuJahreszahl New year (optional; must already be validated)
 *
 * @param {string} neuLand New country (optional; must already be validated)
 *
 * @returns {Promise<number>} Promise fulfilled with the ID of the updated record
 */
async function aendereDatensatz( id, neuJahreszahl, neuLand ) {

    if ( !neuJahreszahl && !neuLand ) {

        reject( new Error( "Weder neues Jahr noch neues Land übergeben." ));
    }

    const datenbank = await holeDatenbankVerbindung();

    return new Promise( (resolve, reject) => {

        const tx    = datenbank.transaction( STORE_LISTENEINTRAEGE, "readwrite" );
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
