const Application = require("./Application");
/**
 * @class UrlMapApplication
 */
class UrlMapApplication extends Application
{
    async init(server)
    {
        super.init(server);
        this.urlmap = [];
    }

    addMap(regex, uri)
    {
        this.urlmap.push({ regex: regex, uri: uri });
    }

    keepDefaultUri()
    {
        return true;
    }

    prepareUri(ctx)
    {
        let path = decodeURIComponent( ctx.request.path );

        for( let item of this.urlmap )
        {
            let uri = null;

            item.regex.lastIndex = 0;
            let result = item.regex.exec( path );
            // console.log( path, result );
            if( result )
            {
                uri = {
                    service:this.defaultService,
                    controller:"Home",
                    method:"index",
                    vars:[]
                };

                if( item.uri.service )
                    uri.service = typeof item.uri.service === "number" ? result[item.uri.service] : item.uri.service;

                if( item.uri.controller )
                    uri.controller = typeof item.uri.controller === "number" ? result[item.uri.controller] : item.uri.controller;

                if( item.uri.method )
                    uri.method = typeof item.uri.method === "number" ? result[item.uri.method] : item.uri.method;
                
                if( item.uri.vars )
                {
                    for( let v of item.uri.vars )
                    {
                        uri.vars.push( typeof v === "number" ? result[v] : v );
                    }
                }

                ctx.uri = uri;
                break;
            }
        }

        if( !ctx.uri )
        {
            if( this.keepDefaultUri() )
            {
                super.prepareUri( ctx );
            }
            else
            {
                ctx.uri = { service:this.defaultService, controller:"Error", method:"error404", vars:[] };
            }
        }
    }
}

module.exports = UrlMapApplication;
