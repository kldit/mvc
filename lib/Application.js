const fs = require("fs");
const glob = require("glob-promise");
const util = require('./util');
const mustache = util.optionalRequire('mustache');
const ejs = util.optionalRequire('ejs');
const BaseModel = require('@kldit/mvc/lib/BaseModel');

const path = require('path');
const BASE_PATH = path.dirname(require.main.filename) + "/";

let cluster;

const CLUSTER_BOOL = Boolean.parse(process.env.CLUSTER);

if(CLUSTER_BOOL)
{
    cluster = require('cluster');
}


module.exports = class Application
{
    init(server)
    {
        this.services = {};
        this.isMaster = !CLUSTER_BOOL || cluster.isMaster;

        this.setDefaultService('base', __dirname + "/../" + 'base');
    }

    _workerSend(msg, resolve, reject)
    {
        msg.id = ++this.msgId;
        this.msgObjs[msg.id] = [resolve, reject];
        process.send(msg);
    }

    _workerReceive(msg)
    {
        let [resolve, reject] = this.msgObjs[msg.id];

        if(msg.error)
        {
            reject(msg.error);
        }
        else
        {
            resolve(msg.result);
        }

        delete this.msgObjs[msg.id];
    }

    async _masterReceive(worker, msg)
    {
        try
        {
            let service = this.services[msg.service];
            msg.result = await service[msg.method].apply(service, msg.args);
        }
        catch (err)
        {
            msg.error = err;
        }

        return msg;
    }

    setDefaultService(name, path = BASE_PATH + name)
    {
        this.loadService(name, path);
        this.defaultApp = name;
    }

    async loadService(name, path = BASE_PATH + name)
    {
        try
        {
            if(!path) path = name;

            this.services[name] = { model: {}, controller: {}, view: {} };

            await this.loadControllers(name, path);
            await this.loadModels(name, path);
            this.loadViews(name, path);

            for(var i in this.services[name].controller)
            {
                var controller = this.services[name].controller[i];
                controller.init();
            }

            for(var i in this.services[name].model)
            {
                var model = this.services[name].model[i];
                if(model.init) model.init();
            }

            let self = this;
            if(fs.existsSync(path + "/view"))
            {
                fs.watch(path + "/view", { recursive: true }, function (event, filename)
                {
                    console.log("Reloading Views");
                    self.loadViews(name, path);
                });
            }
        }
        catch (err)
        {
            console.error(err);
        }
    }

    async loadControllers(name, path)
    {
        var files = await glob(path + "/controller/*.js");
        for(var i in files)
        {
            var file = files[i];
            var temp = file.split('/').pop().split('.js')[0];
            this.services[name].controller[temp] = new(require.main.require(file))(this, name);
        }
    }

    async loadModels(name, path)
    {
        let files = await glob(path + "/model/*Model.js")
        for(let i in files)
        {
            let file = files[i];
            let temp = file.split('/').pop().split('Model.js')[0];
            let classs = require.main.require(file);

            if(!CLUSTER_BOOL ||
                this.isMaster && classs.instanceMode() == BaseModel.MASTER_CLUSTER ||
                !this.isMaster && classs.instanceMode() == BaseModel.SLAVE_CLUSTER)
            {
                this.services[name].model[temp] = new(classs)(this, name);
            }
            else if(!this.isMaster && classs.instanceMode() == BaseModel.MASTER_CLUSTER)
            {
                this.msgId = 0;
                this.msgObjs = {};
                let self = this;

                // console.log( util.getClassMethods( service.prototype ) );
                let methods = Object.getOwnPropertyNames(classs.prototype);

                let service = {};
                for(let m of methods)
                {
                    if(m != "init")
                    {
                        service[m] = async function ()
                        {
                            let result = await (new Promise(function (resolve, reject)
                            {
                                let msg = { service: temp, method: m, args: arguments };
                                self._workerSend(msg, resolve, reject);
                            }));

                            return result;
                        }
                    }
                }

                this.services[name].model[temp] = service;
            }
        }
    }

    loadViews(name, path)
    {
        var self = this;
        glob(path + "/view/*", function (er, files)
        {
            for(var i in files)
            {
                var file = files[i];
                var part = file.split('/').pop().split('View.');
                var ext = part.pop();
                var temp = part.join('View.');

                if(ext == 'mst')
                {
                    var loaded = fs.readFileSync(file, process.env.ENCODE);

                    if(!mustache)
                        throw new Error('Error, Mustache not installed, document: ' + loaded);

                    mustache.parse(loaded);
                    self.services[name].view[temp] = [ext, loaded];
                }
                else if(ext == 'ejs')
                {
                    if(!ejs)
                        throw new Error('Error, ejs not installed, document: ' + loaded);

                    var loaded = fs.readFileSync(file, process.env.ENCODE);
                    self.services[name].view[temp] = [ext, ejs.compile(loaded)];
                }
                else if(ext == 'js')
                {
                    var r = file.split('.');
                    r.pop();
                    var loaded = require.main.require(r.join('.'));
                    self.services[name].view[temp] = [ext, loaded];
                }
            }
        });
    }

    prepareUri(ctx)
    {
        let request = ctx.request.path.substring(1).split(/[\\/]/);
        let uri = null;

        // Empty URI
        if(request.length == 1 && request[0] == '')
        {
            uri = {
                app: this.defaultApp,
                controller: 'home',
                method: 'index',
                vars: []
            };
        }
        else
        {
            let app = this.defaultApp;

            // It is a not default app
            if(this.services[request[0]] != null)
            {
                app = request[0];
                request = request.splice(1);
            }
            console.log(app, request)
            uri = {
                app: app,
                controller: request.length <= 1 && !request[0] ? 'home' : request[0],
                method: request.length > 1 && request[1] != '' ? request[1] : 'index',
                vars: request.splice(2)
            };
        }

        ctx.uri = uri;

        /*


        var uri = ;

        uri['vars'] = request.splice(2);

        ctx.uri = uri;

        if(ctx.uri.controller == process.env.CMS_PATH)
            {
                ctx.uri.controller = ctx.uri.method;
                ctx.uri.method = ctx.uri.vars[0];
                ctx.uri.vars = ctx.uri.vars.splice(1);

                if(!ctx.uri.method) ctx.uri.method = 'index';

                name = ctx.uri.controller.slugify();
                target = this.services.base.controller[name];

                // console.log( util.inspect( ctx.uri, null, false, true ) );
            }*/
    }

    async run(ctx)
    {
        try
        {
            let name = ctx.uri.controller.slugToCapitalized();
            let target = null;

            // Look for the app
            target = this.services[ctx.uri.app].controller[name];
            
            // Look for base app
            if(target == null) target = this.services.base.controller[name];

            // Look for home (if it has method for it or accepts any )
            if(target == null)
            {
                target = this.services[ctx.uri.app].controller.Home;

                if(target == null)
                {
                    target = this.run404(ctx);
                }
                else if(target[ctx.uri.controller] != null)
                {
                    ctx.uri.vars.unshift(ctx.uri.method);
                    ctx.uri.method = ctx.uri.controller;
                    ctx.uri.controller = 'home';
                }
                else if(target.any != null)
                {
                    ctx.uri.vars.unshift(ctx.uri.controller);
                    ctx.uri.method = 'any';
                    ctx.uri.controller = 'home';
                }
                else
                {
                    target = this.run404(ctx);
                }
            }

            if(target)
            {
                if(await target.preHandle(ctx))
                {
                    var method = ctx.uri.method.slugToCapitalized().firstCharToLowerCase();

                    if(target[method])
                    {
                        await (target[method])(ctx);
                    }
                    else
                    {
                        if(target.index)
                        {
                            ctx.uri.vars.unshift(ctx.uri.method);
                            ctx.uri.method = 'index';

                            await target.index(ctx);
                        }
                        else if(target.any)
                            await target.any(ctx);
                        else
                        {
                            target = this.run404(ctx);
                            await target.index(ctx);
                        }
                    }

                    await target.posHandle(ctx);
                    ctx.response.send();
                }
                else
                {
                    ctx.response.send();
                }
            }
        }
        catch (err)
        {
            console.error(err);

            ctx.serverError = err;
            await this.runError(ctx);
        }
    }

    run404(ctx)
    {
        // Look for default app
        var target = this.services[this.defaultApp].controller.Error;

        // Look for base app
        if(target == null) target = this.services.base.controller.Error;

        ctx.uri.method = 'error404';

        return target;
    }

    async runError(ctx)
    {
        // Look for the app
        let target = this.services[ctx.uri.app].controller.Error;

        // Look for default app
        if( target == null ) target = this.services[this.defaultApp].controller.Error;

        // Look for base app
        if(target == null) target = this.services.base.controller.Error;

        if(await target.preHandle(ctx))
        {
            await target.error(ctx);
            // console.log("runError");
            await target.posHandle(ctx);
            ctx.response.send();
        }
        else
        {
            ctx.response.send();
        }
    }

    getModel(name, service = this.defaultApp)
    {
        // Look for the app
        // console.log( name, service );
        var target = this.services[service].model[name];

        // Look for base app
        if(target == null) target = this.services.base.model[name];

        return target;
    }

    getView(name, service = this.defaultApp)
    {
        // Look for default app
        var target = this.services[service].view[name];

        // Look for base app
        if(target == null) target = this.services.base.view[name];

        return target;
    }

    getDbConnection()
    {
        return null;
    }

    releaseDbConnection()
    {

    }
}
