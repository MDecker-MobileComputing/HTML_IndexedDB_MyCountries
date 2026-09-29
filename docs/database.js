"use strict";

const DATABASE_NAME = "AllMyCountriesDatabase";
const RECORD_STORE  = "countries";


/**
 * Get the database connection (create the database if necessary).
 *
 * @returns {Promise<IDBDatabase>} Promise for the database connection
 */
async function getDatabaseConnection() {

    return new Promise( (resolve, reject) => {

        const idbOpenRequest = window.indexedDB.open( DATABASE_NAME, 2 );

        idbOpenRequest.onsuccess = (event) => {

            const db = event.target.result;
            console.log( `Database \"${DATABASE_NAME}\" opened successfully.` );
            return resolve( db );
        };

        idbOpenRequest.onerror = (event) => {

            const error = event.target.error;
            console.error( `Error when opening the database \"${DATABASE_NAME}\":`, error );
            return reject( error );
        };

        idbOpenRequest.onupgradeneeded = (event) => {

            console.log( `Creating/updating database \"${DATABASE_NAME}\".` );
            const db = event.target.result;
            let store;

            // Create the object store if it does not already exist
            if ( !db.objectStoreNames.contains( RECORD_STORE ) ) {

                store = db.createObjectStore( RECORD_STORE, {
                    keyPath: "id",
                    autoIncrement: true
                });
                console.log( `Object store \"${RECORD_STORE}\" created.` );
            }
            else {

                store = event.target.transaction.objectStore( RECORD_STORE );
            }

            if ( event.oldVersion < 2 && event.oldVersion > 0 ) {

                const cursorRequest = store.openCursor();
                cursorRequest.onsuccess = () => {

                    const cursor = cursorRequest.result;
                    if ( !cursor ) { return; }

                    const record = cursor.value;
                    if ( "year" in record ) {
                        record.year = record.jahr;
                        delete record.jahr;
                    }
                    if ( "year" in record ) {
                        record.country = record.land;
                        delete record.land;
                    }

                    cursor.update( record );
                    cursor.continue();
                };
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
async function addRecord( year, country ) {

    const database = await getDatabaseConnection();

    return new Promise( ( resolve, reject ) => {

                const transaction = database.transaction( RECORD_STORE, "readwrite" );
                const store = transaction.objectStore( RECORD_STORE );

                const countryRecord = {
                                                         year: year,
                                                         country: country
                           };

                const addRequest = store.add( countryRecord );

                addRequest.onsuccess = () => resolve( addRequest.result );
                addRequest.onerror   = () => reject(  addRequest.error  );
    });
}


/**
 * Get all saved records (countries and years) from the database.
 *
 * @returns {Promise<Array>} Promise containing an array of all country objects,
 *                           sorted by year in ascending order
 */
async function getAllRecords() {

    const database = await getDatabaseConnection();

    return new Promise( ( resolve, reject ) => {

        const transaction = database.transaction( RECORD_STORE, "readonly" );
        const store = transaction.objectStore( RECORD_STORE );

        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = function() {

            let records = getAllRequest.result;
            records = records.sort( (a, b) => {
                return a.year - b.year;
            });
            resolve( records );

        };
        getAllRequest.onerror = function() { reject(  request.error ); };
    });
}


/**
 * Delete a record from the database.
 *
 * @param {number} id ID of the record to delete
 *
 * @returns {Promise<void>} Promise fulfilled when the deletion succeeds
 */
async function deleteRecord( id ) {

    const database = await getDatabaseConnection();

    return new Promise( (resolve, reject) => {

        const transaction = database.transaction( RECORD_STORE, "readwrite" );
        const store = transaction.objectStore( RECORD_STORE );

        const deleteRequest = store.delete( id );

        deleteRequest.onsuccess = function() { resolve();               };
        deleteRequest.onerror   = function() { reject( request.error ); };
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
async function updateRecord( id, newYear, newCountry ) {

    if ( !newYear && !newCountry ) {

        reject( new Error( "Weder neues Jahr noch neues Land übergeben." ));
    }

    const database = await getDatabaseConnection();

    return new Promise( (resolve, reject) => {

        const transaction = database.transaction( RECORD_STORE, "readwrite" );
        const store = transaction.objectStore( RECORD_STORE );

        const getRequest = store.get( id );

        getRequest.onerror = function() { reject( getRequest.error ); }

        getRequest.onsuccess = function() {

            const record = getRequest.result;
            if ( !record ) {

                reject( new Error( `Datensatz mit ID=${id} nicht gefunden.` ) );
                return;
            }

            if ( newYear ) { record.year = newYear };
            if ( newCountry ) { record.country = newCountry };

            const putRequest = store.put( record );
            putRequest.onsuccess = function() { resolve( putRequest.result ); }
            putRequest.onerror   = function() { reject( putRequest.error   ); }
        }
    });
}
