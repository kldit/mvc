module.exports = class BaseController
{
    constructor(app, serviceName)
    {
        this.app = app;
        this.service = serviceName;
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
        this.model[name.firstCharToLowerCase()] = this.app.getModel(name, this.service);
    }

    renderView(name, vars)
    {
        if(vars === undefined) vars = {};
        var view = this.app.getView(name, this.service);

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