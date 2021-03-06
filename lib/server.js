const mvc = require('@kldit/mvc');
const fs = require('fs');
module.exports.mvc = mvc;
let cluster = null;

const CLUSTER_BOOL = Boolean.parse(process.env.CLUSTER);

if(CLUSTER_BOOL)
{
    cluster = require('cluster');
}

/**
 * @module server
 */
if(CLUSTER_BOOL && cluster.isMaster)
{
    /**
     * Define the target Aplication to be "linked" to the koa server.
     * @function setApplication
     * @param {Application} theApp - The application object to be set.
     */
    module.exports.setApplication = function (theApp)
    {
        // theApp.loadServices(true);

        const numCPUs = require('os').cpus().length;
        // Fork workers.
        for(var i = 0; i < numCPUs; i++)
        {
            const worker = cluster.fork();
            // worker.send(`Hello worker ${worker.id}, I am your master!`)
            worker.on('message', async (msg) =>
            {
                worker.send(await theApp._masterReceive(worker, msg));
            });
        }

        cluster.on('exit', (worker, code, signal) =>
        {
            console.log(`Worker ${worker.process.pid} died`);
            console.log('Starting a new worker');
            cluster.fork();
        });
    };
}
else
{
    (function ()
    {
        let setApplication = async function (theApp)
        {
            const compress = require('koa-compress');
            const session = require('koa-session');
            const koaBody = require('koa-body');
            const Koa = require('koa');
            const app = new Koa();
            const log = require('./log');
            const path = require('path');

            // SET APP ADDRESS
            var HOSTNAME, PATH_NAME;
            if(process.env.HOSTNAMES != '')
            {
                HOSTNAME = process.env.HOSTNAMES;
                PATH_NAME = process.env.PATH_NAMES;
                process.env.HOME = "https://" + HOSTNAME + PATH_NAME;
            }
            else
            {
                HOSTNAME = process.env.HOSTNAME;
                PATH_NAME = process.env.PATH_NAME;
                process.env.HOME = "http://" + HOSTNAME + ":" + process.env.PORT + PATH_NAME;
            }

            process.env.STORAGE_PATH = path.dirname(require.main.filename) + "/" + process.env.STORAGE;
            await theApp.init(app);
            const server = app.listen( process.env.PORT ? process.env.PORT : 3000 );

            // Session
            app.keys = [process.env.SESSION_KEY];
            app.use(session(app));

            // POST Data
            app.use(koaBody({ multipart: true }));

            app.use(async function (ctx, next)
            {
                console.log(ctx.request.path, ctx.request.body);
                console.log("\n");
                await next();
            });

            app.use(compress(
            {
                filter: function (content_type)
                {
                    return /text/i.test(content_type)
                },
                threshold: 2048,
                flush: require('zlib').Z_SYNC_FLUSH
            }));

            app.use(async (ctx, next) =>
            {
                // Check url is right
                const requestUri = ctx.request.url;

                // TODO: When using SSL, redirect 80 -> 443
                /*if( 'https://'.$_SERVER['HTTP_HOST'].'/' != BASE_PATH || $_SERVER['SERVER_PORT'] != 443 )
                {
                    header( 'Location:'.BASE_PATH.substr( $request_uri, 1 ) );
                    exit();
                }*/

                if(ctx.hostname != HOSTNAME)
                {
                    const PORT = server.address().port;
                    var redirect = (PORT == 443 ? "https://" : "http://") +
                        HOSTNAME + (PORT != 80 && PORT != 443 ? ":" + PORT : "") +
                        ctx.url;

                    ctx.redirect(redirect);
                }
                else
                {
                    theApp.prepareUri(ctx);

                    await next();
                }
            });

            if(CLUSTER_BOOL)
            {
                //theApp.loadServices(false);

                cluster.worker.on('message', (msg) =>
                {
                    theApp._workerReceive(msg);
                });
            }
            else
            {
                // theApp.loadServices(true);
            }

            const getDbConnection = async function ()
            {
                if(!this._db)
                {
                    this._db = await theApp.getDbConnection();
                }

                return this._db;
            }

            app.use(async (ctx, next) =>
            {
                try
                {
                    await (new Promise(function (resolve, reject)
                    {
                        ctx.response.send = resolve;
                        ctx.response.reject = reject;
                        ctx.db = getDbConnection;

                        theApp.run(ctx);
                    }));
                    //var temp = new Promise();
                    //await theApp.run( ctx );
                    // console.log( "after" );
                }
                catch (err)
                {
                    console.error(err);
                }

                await next();
            });

            app.use(async function (ctx)
            {
                if(ctx._db) await theApp.releaseDbConnection( ctx._db );

                // Save console to logs
                log.accessLog(ctx);
                const used = process.memoryUsage().heapUsed / 1024 / 1024;
                console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
            });

            const used = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log(`Setup ${cluster ? 'cluster ' + cluster.worker.id + ': ' : ''} ${Math.round(used * 100) / 100} MB`);
        };

        module.exports.setApplication = setApplication;
    })();
}

/*
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'upcms_site',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.get('X-Response-Time');
    console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time

app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
});

app.use(async ctx => {
    //const conn = await pool.promise().getConnection();
    //const [rows,fields] = await conn.query("SELECT * FROM services");
    ctx.body = ctx.request;	
    //pool.releaseConnection(conn);
});
*/
