var mongoose = require('mongoose');
const { AsyncLocalStorage } = require('async_hooks');
var mtMongooseStorage = new AsyncLocalStorage();
var multiDb = {};
var defaultDb = null;
var systemDb = null;
var MTMongoose = function () {};
//Default tenant db which is used to perform useDB operation.
MTMongoose.prototype.setDefaultTenantDB = function (_defaultDB) {
  defaultDb = _defaultDB;
};

//Utility Method to set system(non tenant specific DB) Use this method, so that the model usage across tenant specific and non tenant specific will look same.
MTMongoose.prototype.setGlobalDB = function (_systemDb) {
  systemDb = _systemDb;
};
//Method used to set
MTMongoose.prototype.setTenantId = function (req, res, next) {
  mtMongooseStorage.run(req['_tid'], next);
};

MTMongoose.prototype.getTenantId = function () {
  return mtMongooseStorage.getStore();
};

MTMongoose.prototype.getMTModel = function (schemaObj) {
  var tenantDBId = this.getTenantId();
  var tenantDB = defaultDb.useDb(tenantDBId ? tenantDBId : 'test');
  if (tenantDB) {
    return tenantDB.model(
      schemaObj.modelName ? schemaObj.modelName : schemaObj.name,
      schemaObj.schema,
    );
  }
};
MTMongoose.prototype.getSystemModel = function (schemaObj) {
  return systemDb.model(
    schemaObj.modelName ? schemaObj.modelName : schemaObj.name,
    schemaObj.schema,
  );
};

MTMongoose.prototype.getModel = function (schemaObj) {
  if (schemaObj.isGlobal) {
    return this.getSystemModel(schemaObj);
  } else {
    return this.getMTModel(schemaObj);
  }
};

//#region MT Mongoose with Tenant URI

//Default tenant db which is used to perform useDB operation.
MTMongoose.prototype.setMultiTenantviaURI = function (tenantId, tenantUri) {
  const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
  };

  if (multiDb[tenantId] == null) {
    var defaultTenantDb = mongoose.createConnection(tenantUri, mongoOptions);
    multiDb[tenantId] = defaultTenantDb;
  }
};

//Default tenant db which is used to perform useDB operation.
MTMongoose.prototype.setMultiTenantviaDB = function (tenantId, tenantDb) {
  multiDb[tenantId] = tenantDb;
};

MTMongoose.prototype.setMultiTenantId = function (req, res, next) {
  mtMongooseStorage.run(req['_tid'], next);
};

MTMongoose.prototype.getMultiTenantId = function () {
  return mtMongooseStorage.getStore();
};

MTMongoose.prototype.getTenantMTModel = function (schemaObj) {
  var tenantDBId = this.getTenantId();
  var tenantDB = multiDb[tenantDBId];
  if (tenantDB) {
    if (!tenantDB.models.hasOwnProperty(schemaObj.modelName)) {
      return tenantDB.model(
        schemaObj.modelName ? schemaObj.modelName : schemaObj.name,
        schemaObj.schema,
      );
    } else {
      return tenantDB.models[schemaObj.modelName];
    }
  }
};
MTMongoose.prototype.getTenantSystemModel = function (schemaObj) {
  return systemDb.model(
    schemaObj.modelName ? schemaObj.modelName : schemaObj.name,
    schemaObj.schema,
  );
};

MTMongoose.prototype.getTenantModel = function (schemaObj) {
  if (schemaObj.isGlobal) {
    return this.getTenantSystemModel(schemaObj);
  } else {
    return this.getTenantMTModel(schemaObj);
  }
};

//#endregion

module.exports = new MTMongoose();
