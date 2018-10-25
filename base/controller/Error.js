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
        ctx.set('Access-Control-Allow-Credentials', 'true');
        ctx.set('Access-Control-Allow-Origin', process.env.CMS_DOMAIN);
        ctx.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        
        ctx.response.status = 404;
        ctx.body = { status: false, error: 404 };
    }

    error( ctx )
    {
        ctx.set('Access-Control-Allow-Credentials', 'true');
        ctx.set('Access-Control-Allow-Origin', process.env.CMS_DOMAIN);
        ctx.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

        ctx.response.status = ctx.serverError.status || 500;
        ctx.body = "Error 500" + 
            ( process.env.ENV == "development" ? "\n" + ctx.serverError.message : "" );

        ctx.app.emit('error', ctx.serverError, ctx);
    }
}