"use strict";

// References to DOM elements
let yearInput   = null;
let countryInput = null;
let tableDiv    = null;
let tableBody   = null;
let countryCount = null;

let currentYear = new Date().getFullYear();

const MIN_YEAR = 1900;


/**
 * Event handler called when the webpage has loaded.
 */
window.addEventListener( "load", async function () {

    yearInput    = document.getElementById( "yearInput"    );
    countryInput = document.getElementById( "countryInput" );
    tableBody    = document.getElementById( "tableBody"    );
    countryCount = document.getElementById( "countryCount" );

    if ( !yearInput || !countryInput || !tableBody ) {

        this.alert( "Internal error: At least one HTML element could not be found." );
        return;
    }

    resetForm();

    const saveButton  = this.document.getElementById( "saveButton"  );
    const resetButton = this.document.getElementById( "resetButton" );

    saveButton.addEventListener(  "click", saveCountry );
    resetButton.addEventListener( "click", resetForm );

    await loadData();
});


/**
 * Load data from the database and display it in the table.
 */
async function loadData() {

    // Clear the table
    tableBody.innerHTML    = "";
    countryCount.textContent = "0";

    try {

        const countries = await getAllRecords();

        for ( let i = 0; i < countries.length; i++ ) {

            const id      = countries[i].id;
            const year    = countries[i].year;
            const country = countries[i].country;
            addTableRow( id, year, country );
        }

        countryCount.textContent = countries.length + "";
    }
    catch ( error ) {

        console.error( "Error loading the database:", error );
        alert( "Error loading the database." );
    }
}


/**
 * Event handler for the "Save" button.
 *
 * @param {object} event Event object
 */
async function saveCountry( event ) {

    event.preventDefault();

    const yearString = yearInput.value.trim();
    if ( !yearString ) {

        alert( "No year entered." );
        return;
    }
    const year = Number( yearString );
    if ( year < MIN_YEAR ) {

         alert( "The year is too far in the past." );
         return;
    }
    if ( year > currentYear ) {

         alert( "The year is in the future." );
         return;
    }

    const country = countryInput.value.trim();
    if ( country.length === 0 ) {

        alert( "Invalid entry: Country cannot be empty." );
        return;
    }

    try {

        await addRecord( year, country );
        loadData();
    }
    catch ( error ) {

        console.error( "Error saving record:", error );
        alert( "Error saving the record." );
    }
}


/**
 * Event handler for the "Reset" button.
 *
 * @param {object} event Event object
 */
function resetForm( event ) {

    if ( event ) { event.preventDefault(); }

    yearInput.value = currentYear;
    countryInput.value = "";
}


/**
 * Insert a row into the table.
 *
 * @param {number} id Record ID
 *
 * @param {number} year Year of the first visit (must already be validated)
 *
 * @param {string} country Country, e.g. "France" (must already be validated)
 */
function addTableRow( id, year, country ) {

    const tableRow = document.createElement( "tr" );

    const yearCell       = document.createElement( "td" );
    const countryCell    = document.createElement( "td" );
    const deleteCell     = document.createElement( "td" );
    const editYearCell   = document.createElement( "td" );
    const editCountryCell = document.createElement( "td" );

    yearCell.textContent = year + "";
    countryCell.textContent = country;

    const deleteLink = document.createElement( "a" );
    deleteLink.href = "#";
    deleteLink.textContent = "Delete";
    deleteLink.addEventListener( "click", (event) => { onDeleteClick( event, id, country, year ); });
    deleteCell.appendChild( deleteLink );

    const editYearLink = document.createElement( "a" );
    editYearLink.href = "#";
    editYearLink.textContent = "Edit year";
    editYearLink.addEventListener( "click", (event) => { onEditYearClick( event, id, country, year ); });
    editYearCell.appendChild( editYearLink );

    const editCountryLink = document.createElement( "a" );
    editCountryLink.href = "#";
    editCountryLink.textContent = "Edit country";
    editCountryLink.addEventListener( "click", (event) => { onEditCountryClick( event, id, country, year ); });
    editCountryCell.appendChild( editCountryLink );

    tableRow.appendChild( yearCell );
    tableRow.appendChild( countryCell );
    tableRow.appendChild( deleteCell );
    tableRow.appendChild( editYearCell );
    tableRow.appendChild( editCountryCell );

    tableBody.appendChild( tableRow );
}


/**
 * Event handler for deleting a record.
 *
 * @param {object} event Event object
 *
 * @param {number} id ID of the record to update
 *
 * @param {string} country Country, e.g. "France"
 *
 * @param {number} year Year of the first visit, e.g. 1986
 */
async function onDeleteClick( event, id, country, year ) {

    event.preventDefault();

    const confirmed = confirm( `Are you sure you want to delete the entry for "${country}" from ${year}?` );
    if ( confirmed === true ) {

        try {

            await deleteRecord( id );

            await loadData();
        }
        catch ( error ) {

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
 * @param {string} country Country, e.g. "France"
 *
 * @param {number} year Year of the first visit (to be changed)
 */
async function onEditYearClick( event, id, country, year ) {

    event.preventDefault();

        const newYearString =
            prompt( `Enter the new year you visited "${country}":`,
                year );

        if ( !newYearString ) { return; }

        const newYear = Number( newYearString );
        if ( !newYear ) {

        alert( "Invalid year entered." );
        return;
    }
    if ( newYear < MIN_YEAR ) {

        alert( "Error: The entered year is too far in the past." );
        return;
    }
    if ( newYear > currentYear ) {

        alert( "Error: The entered year is in the future." );
        return;
    }

    try {

        await updateRecord( id, newYear, null );

        await loadData();
    }
    catch ( error ) {

        console.log( `Error changing the year for record with ID=${id}.`, error );
        alert( "An error occurred while updating the record." );
    }
}


/**
 * Event handler for changing a record's country.
 *
 * @param {object} event Event object
 *
 * @param {number} id ID of the record to update
 *
 * @param {string} country Country, e.g. "France"
 *
 * @param {number} year Year of the first visit (to be changed)
 */
async function onEditCountryClick( event, id, country, year ) {

    event.preventDefault();

    let newCountry = prompt( `Enter the new country for ${year}:`, country );
    if ( !newCountry ) { return; }

    newCountry = newCountry.trim();

    if ( newCountry.length === 0 ) {

        alert( "Error: No country entered." );
        return;
    }

    try {

        await updateRecord( id, null, newCountry );

        await loadData();
    }
    catch ( error ) {

        console.log( `Error changing the country for record with ID=${id}.`, error );
        alert( "An error occurred while updating the record." );
    }
}
