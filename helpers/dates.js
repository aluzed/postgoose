/**
* @module Helpers/DateHelpers
* 
* @description Set of tools to convert Date from JS > DB and DB > JS
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/

/**
 * Displays numbers on 2 digits
 * 
 * @function NumberFormatter
 * 
 * @param {Number} num Integer
 * @returns {String} 2 digits number as string
 */
function NumberFormatter(num) {
    let numToStr = num.toString();

    if(num < 10) {
        numToStr = '0' + numToStr;    
    }

    return numToStr;
}

module.exports = {
    /**
     * toDateSQL 
     * 
     * Converts a date to mysql date string format
     * 
     * @param {Date} date
     * @return {String} date to mysql format
     */
    toDateSQL: (date) => {
        if(typeof date === "undefined")
            throw new Error('Error, cannot convert an undefined value to date');

        let d = new Date(date);

        let day   = NumberFormatter(d.getDate());
        let month = NumberFormatter(d.getMonth() + 1);
        let year  = d.getFullYear();

        return `${year}-${month}-${day}`;
    },
    /**
     * toDatetimeSQL 
     * 
     * Converts a date to mysql datetime string format
     * 
     * @param {Date} date
     * @return {String} date to mysql format
     */
    toDatetimeSQL: (date) => {
        if (typeof date === "undefined")
            throw new Error('Error, cannot convert an undefined value to datetime');

        let d = new Date(date);

        let day   = NumberFormatter(d.getDate());
        let month = NumberFormatter(d.getMonth() + 1);
        let year  = d.getFullYear();
        let hour  = NumberFormatter(d.getHours());
        let min   = NumberFormatter(d.getMinutes());
        let sec   = NumberFormatter(d.getSeconds());

        return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
    }
}