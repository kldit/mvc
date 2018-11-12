/**
 * Load all the classes and objects needed for Application, BaseModel and BaseController classes
 *
 * @author Orlando Leite
 * @module mvc
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
    /** @property {class} BaseModel class */
    BaseModel: require('./lib/BaseModel'), 

    /** @property {class} BaseController class */
    BaseController: require('./lib/BaseController'), 

    /** @property {class} Application class */
    Application: require('./lib/Application'), 

    /** @property {class} UrlMapApplication class */
    UrlMapApplication: require('./lib/UrlMapApplication'), 

    /** @property {object} server module */
    server:require('./lib/server'),

    /** @property {object} log module */
    log:require('./lib/log'),

    /** @property {object} util module */
    util:require('./lib/util') };
