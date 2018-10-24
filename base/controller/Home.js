const mvc = require.main.require('@Kldit/mvc');

/**
 * @author Orlando Leite
 *
 * Home class
 */
module.exports = class Home extends mvc.BaseController
{
    index(ctx)
    {
        ctx.body = 'Kldit::MVC';
    }
}
