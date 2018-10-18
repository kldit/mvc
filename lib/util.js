const ejs = require('ejs');
const util = require('util');


util.optionalRequire = function (path)
{
    try { return require(path) }
    catch (e) { return null; }
}

// https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
Object.defineProperty(Array.prototype, 'diff',
{
    enumerable: false,
    value: function (array)
    {
        return this.filter(function (i) { return array.indexOf(i) < 0; });
    }
});

Object.searchPropertyValue = function (obj, val)
{
    var list = Object.keys(obj);

    for(var i of list)
    {
        console.log(i, val);
        if(obj[i] == val) return i;
    }

    return false;
};

util.renderJsLine = function (str, data)
{
    if(str && String.isString(str))
    {
        try
        {
            return ejs.render(
                str, 
                data, 
                { 
                    openDelimiter:'{', 
                    closeDelimiter:'}', 
                    delimiter:'', 
                    forceEscape:true, 
                    escape:function (v) { return v } 
                });
        }
        catch (err)
        {
            console.log(str, err);

            return null;
        }
    }
    else
        return str;
}

util.renderJsLines = function (prop, data)
{
    if(String.isString(prop))
        return util.renderJsLine(prop, data);
    else
    {
        var result;
        if(Array.isArray(prop))
            result = [];
        else if(typeof prop == "object")
            result = {}

        for(var key in prop)
        {
            var value = prop[key];
            result[key] = util.renderJsLines(value, data);
        }

        return result;
    }
};

module.exports = util;
