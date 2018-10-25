/**
 * @author Orlando Leite
 * @class BaseModel
 */
class BaseModel
{
    constructor(app)
    {
        this.app = app;
        this.services = app.services;
    }

    static instanceMode()
    {
        return BaseModel.SLAVE_CLUSTER;
    }

    async createConnection()
    {
        return await this.app.getDbConnection();
    }

    init() {};
}

BaseModel.MASTER_CLUSTER = 1;
BaseModel.SLAVE_CLUSTER = 2;

module.exports = BaseModel;