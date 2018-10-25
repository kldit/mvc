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


module.exports = { 
    BaseModel: require('./lib/BaseModel'), 
    BaseController: require('./lib/BaseController'), 
    Application: require('./lib/Application'), 
    server:require('@kldit/mvc/lib/server'),
    log:require('@kldit/mvc/lib/log') };
