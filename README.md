# mt-mongoose
This is a library module which adds multi tenancy capability to mongoose. By default mongoose models are attached to a single mongo db, in scenarios where each tenant(customer) 
has its own mongo db defined, the logic to switch between mongo dbs gets in middle of business logic. This library helps in abstracting away the multi tenant db switching logic 
from actual business logic code. This can be used with standalone nodejs scripts or frameworks like expressjs.

## how it works?
1. It proposes a slight tweak in declaring the mongoose model, such that it gets created every time its called.
2. This library uses continuation-local-storage module to set the tenant db name in the beginning of the code execution.
3. When the model is getting created it attaches the model to the tenenat specific DB it gets from current session of continuation-local-storage.

## Defining mt-mongoose model 
Here is an example of how to create a mt-mongoose model
<pre><code class="language-javascript">
    var mongoose = require('mongoose');
    var mt_mongoose = require("mt-mongoose");
    User = {
        schema: new mongoose.Schema({
                userid: String,
                firstName: String,
                lastName: String
            }
        ),
        name: "users"
    };
    module.exports = function () {
        return mt_mongoose.getMTModel(User);
    };
</code></pre>

## Using mt-mongoose model 
The mt-mongoose model can be used exactly the same way as mongoose model itself. 
The only deference is an extra function call brackets '()' when initializing.
example:
```
router.get('/index', function (req, res, next) {
    User().find(function (err, users) {
        if (err)
            res.send(err);
        res.json(users);
    });
});
```

## Usage in Express APP(using a middleware)
Create a middleware like this and add it to your app, after mongoose.createConnection is called
```
    var express = require('express');
    var path = require('path');
    var favicon = require('serve-favicon');
    var logger = require('morgan');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var methodOverride = require('method-override');
    var routes = require('./routes/index');
    var base_express_service = require("base-express-service");
    var restify = require('express-restify-mongoose');

    var mongoose = require('mongoose');
    var uri = 'mongodb://localhost/test1'; //this should come from config
    defaultDb = mongoose.createConnection(uri);
    var mt_mongoose= require("mt-mongoose");
    mt_mongoose.setDefaultDB(defaultDb);
    app.use(function(req,res,next){
    mt_mongoose.setTenantId(req.query.tid);//example of fetching tenant id from a query parameter, this can be from use object , session etc.
    }); 
    app.get('/index', function (req, res, next) {
        User().find(function (err, users) {
            if (err)
                res.send(err);
            res.json(users);
        });
    });
```











