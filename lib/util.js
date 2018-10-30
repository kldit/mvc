/**
 * It enhance the default node.js module `util`.
 * @module util
 */


const util = require('util');

/**
 * Optionally equire a file, if it is not found returns null.
 * @function optionalRequire
 * @param {string} path - The module you want to load.
 * @returns {Object} The module or null.
 */
util.optionalRequire = function (path)
{
    try { return require(path) }
    catch (e) { return null; }
}

/**
 * Search for a property that has a value.
 * @function customLog
 * @param {string} path - The module you want to load.
 * @returns {Object} The module or null.
 */
Object.searchPropertyValue = function (obj, val)
{
    var list = Object.keys(obj);

    for(var i of list)
    {
        console.log(i, val);
        if(obj[i] == val) return i;
    }

    return false;
};

module.exports = util;
