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
require('@kldit/util-array-diff');


module.exports = { 
    BaseModel: require('./lib/BaseModel'), 
    BaseController: require('./lib/BaseController'), 
    Application: require('./lib/Application'), 
    server:require('./lib/server'),
    log:require('./lib/log'),
    util:require('./lib/util') };
