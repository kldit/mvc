const mvc = require( '@kldit/mvc' );

/**
 * @author Orlando Leite
 *
 * Error404 class
 */
module.exports = class Error extends mvc.BaseController
{
    error404( ctx )
    {
        ctx.response.status = 404;
        ctx.body = 'Error 404'+ 
            ( process.env.ENV == "development" ? "\n" + ctx.serverError.message : "" );;
    }

    error( ctx )
    {
        ctx.response.status = ctx.serverError.status || 500;
        ctx.body = "Error " + ctx.response.status + 
            ( process.env.ENV == "development" ? "\n" + ctx.serverError.message : "" );

        ctx.app.emit('error', ctx.serverError, ctx);
    }
}