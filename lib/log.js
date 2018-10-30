/**
 * @author Orlando Leite
 *
 * @module log
 */
(function()
{
    const fs = require('fs');
    const formatter = require('date-and-time');

    var currentDate = new Date().getDate();
    var filestamp = formatter.format( new Date(), 'YYYY-MM-DD');
    
    var temp = console.log;
    
    if( process.env.ENV == 'production' )
    {
        console.log = function()
        {
            var value = "[" + new Date().toISOString() + "] > " +
                (new Error).stack.split("\n")[2].trim() + "\n" +
                Array.from( arguments ) + "\n\n";
            fs.appendFile(process.env.LOG_PATH + "/" + "console_log." + filestamp + ".log", value, (err) => {if (err) throw err;});
            temp.apply( null, arguments );
        };
        
        temp = console.info;
        console.info = function()
        {
            var value = "[" + new Date().toISOString() + "] > " +
                (new Error).stack.split("\n")[2].trim() + "\n" +
                Array.from( arguments ) + "\n\n";
            fs.appendFile(process.env.LOG_PATH + "/" + "console_info." + filestamp + ".log", value, (err) => {if (err) throw err;});
            temp.apply( null, arguments );
        };
    }

    temp = console.error;
    console.error = function()
    {
        var value = "[" + new Date().toISOString() + "] > " +
            (new Error).stack.split("\n")[2].trim() + "\n" +
            ( 
                arguments.length == 1 && arguments[0] instanceof Error ? 
                    arguments[0].stack : Array.from( arguments ) 
            ) + "\n\n";
        fs.appendFile(process.env.LOG_PATH + "/" + "console_error." + filestamp + ".log", value, (err) => {if (err) throw err;});
        temp.apply( null, arguments );
    };

    /**
     * @object Log
     */
    module.exports = {
        /**
         * @function accessLog
         * @param {Object} ctx - Koa context object.
         */
        accessLog:function( ctx )
        {
            var date = new Date();
            if( date.getDate() != currentDate ) 
                filestamp = formatter.format( date, 'YYYY-MM-DD');
            
            var value = "[" + ctx.ip + " at " + date.toISOString() + "] > " + ctx.request.method + " - " + ctx.request.url + 
                " -> " + ctx.response.status + "\n";
            fs.appendFile(process.env.LOG_PATH + "/" + "access_log." + filestamp + ".log", value, (err) => {if (err) throw err;});
        },
        
        /**
         * @function databaseLog
         * @param {string} text - Text to be saved.
         */
        databaseLog:function( text )
        {
            fs.appendFile( process.env.LOG_PATH + "/database."+ filestamp + ".log", text, (err) => {if (err) throw err;});
        },
        
        /**
         * Use it to save your custom log.
         * @function customLog
         * @param {string} filename - Where the text will be appended.
         * @param {string} text - Text to be saved.
         */
        customLog:function( filename, text )
        {
            fs.appendFile( process.env.LOG_PATH + "/" + filename + "."+ filestamp + ".log", text, (err) => {if (err) throw err;});
        }
    }
})();
