/**
 * @author Orlando Leite
 *
 * Application, BaseModel and BaseController classes
 */
require('dotenv').config();
require('@kldit/util-boolean-parse');
require('@kldit/util-clean-special-chars');
require('@kldit/util-first-char-case');
require('@kldit/util-is-string');
require('@kldit/util-object-clone');
require('@kldit/util-slug-to-capitalized');
require('@kldit/util-slugify');

const util = require('./lib/util'); 

const mustache = util.optionalRequire('mustache');
const ejs = util.optionalRequire('ejs');

const glob = require("glob-promise");
const fs = require("fs");

const path = require('path');
const BASE_PATH = __dirname + "/";

let cluster;

const CLUSTER_BOOL = Boolean.parse(process.env.CLUSTER);

if(CLUSTER_BOOL)
{
    cluster = require('cluster');
}

class Application
{
    init( server )
    {
        this.apps = {};
        this.services = {};
        this.setDefaultApp('base', BASE_PATH + 'base');
    }

    loadServices(master)
    {
        if(master)
        {
            this.services = {};

            if(fs.existsSync(BASE_PATH + 'service'))
            {
                fs.readdirSync(BASE_PATH + 'service').forEach(file =>
                {
                    let temp = util.lcfirst(file.split('.js')[0]);
                    this.services[temp] = new(require.main.require('./service/' + file))(this);
                    this.services[temp].init();
                });
            }
        }
        else
        {
            this.msgId = 0;
            this.msgObjs = {};
            let self = this;

            fs.readdirSync(BASE_PATH + '/service').forEach(file =>
            {
                let temp = util.lcfirst(file.split('.js')[0]);
                let classs = require(BASE_PATH + '/service/' + file);

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

                self.services[temp] = service;
            });
        }
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

    setDefaultApp(name, path = BASE_PATH + name)
    {
        this.loadApp(name, path);
        this.defaultApp = name;
    }

    async loadApp(name, path = BASE_PATH + name)
    {
        try
        {
            if(!path) path = name;

            this.apps[name] = { model: {}, controller: {}, view: {} };

            await this.loadControllers(name, path);
            await this.loadModels(name, path);
            this.loadViews(name, path);

            for(var i in this.apps[name].controller)
            {
                var controller = this.apps[name].controller[i];
                controller.init();
            }

            for(var i in this.apps[name].model)
            {
                var model = this.apps[name].model[i];
                model.init();
            }

            let self = this;
            if( fs.existsSync( path + "/view" ) )
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
            var temp = file.split('/').pop().split('.js')[0].toLowerCase();
            this.apps[name].controller[temp.slugify()] = new(require.main.require(file))(this);
        }
    }

    async loadModels(name, path)
    {
        var files = await glob(path + "/model/*Model.js")
        for(var i in files)
        {
            var file = files[i];
            var temp = file.split('/').pop().split('Model.js')[0].toLowerCase();
            this.apps[name].model[temp] = new(require.main.require(file))(this);
        }
    }

    loadViews(name, path)
    {
        var self = this;
        glob(BASE_PATH + path + "/view/*", function (er, files)
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
                    self.apps[name].view[temp] = [ext, loaded];
                }
                else if(ext == 'ejs')
                {
                    if(!ejs)
                        throw new Error('Error, ejs not installed, document: ' + loaded);

                    var loaded = fs.readFileSync(file, process.env.ENCODE);
                    self.apps[name].view[temp] = [ext, ejs.compile(loaded)];
                }
                else if(ext == 'js')
                {
                    var r = file.split('.');
                    r.pop();
                    var loaded = require.main.require(r.join('.'));
                    self.apps[name].view[temp] = [ext, loaded];
                }
            }
        });
    }

    async run(ctx)
    {
        try
        {
            let name = ctx.uri.controller.slugify();
            let target = null;

            if(ctx.uri.controller == process.env.CMS_PATH)
            {
                ctx.uri.controller = ctx.uri.method;
                ctx.uri.method = ctx.uri.vars[0];
                ctx.uri.vars = ctx.uri.vars.splice(1);

                if(!ctx.uri.method) ctx.uri.method = 'index';

                name = ctx.uri.controller.slugify();
                target = this.apps.base.controller[name];

                // console.log( util.inspect( ctx.uri, null, false, true ) );
            }
            else
            {
                // Look for default app
                console.log( this.defaultApp );
                target = this.apps[this.defaultApp].controller[name];

                // Look for base app
                if(target == null) target = this.apps.base.controller[name];
            }

            // Look for home (if it has method for it or accepts any )
            if(target == null)
            {
                target = this.apps[this.defaultApp].controller.home;

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

            ctx.response.send();
        }
    }

    run404(ctx)
    {
        // Look for default app
        var target = this.apps[this.defaultApp].controller['error'];

        // Look for base app
        if(target == null) target = this.apps.base.controller['error'];

        ctx.uri.method = 'error404';

        return target;
    }

    async runError(ctx)
    {
        // Look for default app
        var target = this.apps[this.defaultApp].controller['error'];

        // Look for base app
        if(target == null) target = this.apps.base.controller['error'];

        console.log( target );
        if(await target.preHandle(ctx))
        {
            await target.error(ctx);
            
            await target.posHandle(ctx);
            ctx.response.send();
        }
        else
        {
            ctx.response.send();
        }
    }

    getModel(name)
    {
        name = name.toLowerCase();
        // Look for default app
        var target = this.apps[this.defaultApp].model[name];

        // Look for base app
        if(target == null) target = this.apps.base.model[name];

        return target;
    }

    getView(name)
    {
        // Look for default app
        var target = this.apps[this.defaultApp].view[name];

        // Look for base app
        if(target == null) target = this.apps.base.view[name];

        return target;
    }

    async getDbConnection()
    {
        return null;
    }
}

class BaseModel
{
    constructor(app)
    {
        this.app = app;
        this.services = app.services;
    }

    async createConnection()
    {
        return await this.app.getDbConnection();
    }

    init() {};
}

class BaseController
{
    constructor(app)
    {
        this.app = app;
        this.services = app.services;
        this.model = {};

        this.header = [];
        this.footer = [];
        this.content = [];
    }

    init() {};
    async preHandle(ctx) { return true; }
    async posHandle(ctx) {}

    loadModel(name)
    {
        this.model[util.lcfirst(name)] = this.app.getModel(name);
    }

    renderView(name, vars)
    {
        if(vars === undefined) vars = {};
        var view = this.app.getView(name);

        if(vars.render === undefined)
        {
            let self = this;
            vars.render = function (name) { return self.renderView(name, vars); }
        }

        if(view != null)
        {
            if(view[0] == 'mst')
                return mustache.render(view[1], vars);
            else if(view[0] == 'ejs')
            {
                return view[1](vars);
            }
            else if(view[0] == 'js')
                return view[1](vars);
            else
            {
                throw new Error('Error: View \'' + name + '\' extension not supported.');
            }
        }
        else
        {
            throw new Error('Error: View \'' + name + '\' not found.');
        }
    }
}

module.exports = { BaseModel: BaseModel, BaseController: BaseController, Application: Application, server:require('@kldit/mvc/server') };
