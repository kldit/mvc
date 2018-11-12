const mvc = require.main.require('@kldit/mvc');

/**
 * @author Orlando Leite
 *
 * Home class
 */
class Home extends mvc.BaseController
{
    index(ctx)
    {
        ctx.body = 'Kldit::MVC';
    }
}

module.exports = Home;