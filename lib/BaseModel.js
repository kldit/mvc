/**
 * @class BaseModel
 */
class BaseModel
{
    /**
     * Model instances are created when `Application::loadService` is called.
     * @constructor
     * @param {Application} app - The application it running on.
     */
    constructor(app)
    {
        this.app = app;
        this.services = app.services;
    }

    /**
     * Called before load. Based on the value it returns the object will be created or use a shallow messaging object.
     * @returns {number} MASTER_CLUSTER or SLAVE_CLUSTER;
     */
    static instanceMode()
    {
        return BaseModel.SLAVE_CLUSTER;
    }

    /**
     * It is called right after it's created. Use it to load things you need.
     */
    init() {};
}

/**
 * If you are using CLUSTER, the object will be created only once, and all the slave clusters will use a messaging object to comunicate to the master.
 * It is usefull when you are handling a big amount of connections and uses a cached data.
 * @constant {number} BaseModel.MASTER_CLUSTER
 */
BaseModel.MASTER_CLUSTER = 1;

/**
 * If you are using CLUSTER, the object will be created for each slave cluster.
 * @constant {number} BaseModel.SLAVE_CLUSTER
 */
BaseModel.SLAVE_CLUSTER = 2;

module.exports = BaseModel;