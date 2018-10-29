# kldit::mvc

## Install
```bash
npm i --save @kldit/mvc
```

## Getting started
Create a .env with the params:
```bash
# Name in case of https: https://HOSTNAMES/PATH_NAMES
# Leave empty if you're not going to use.
# it will run only in 443 port
HOSTNAMES=
PATH_NAMES=

# Name in case of http: http://HOSTNAME/PATH_NAME
# You have to specify a port
HOSTNAME=localhost
PATH_NAME=
PORT=3000

# Environment (development|production)
ENV=development
# Make sure the path exists
LOG_PATH=log
ENCODE=utf8

# If you want to use cluster (multiple instances of your application)
CLUSTER=false
```

You can start your first app using the code below (`app.js`):
```javascript
const mvc = require('@kldit/mvc');

class MainApplication extends mvc.Application
{

}

mvc.server.setApplication( new MainApplication() );

```
### Run it
```bash
$ node app.js
> INFO: koa-response-time not installed
> Setup  9.95 MB
```

### Test it
```bash
$ curl localhost:3000
> Kldit::MVC
```

## Your first service
Create a folder with the name you want, I'll call `MyService` and make the struct as below:
```bash
MyService
> controller
> model
> view
```

Inside controller folder create a file called `Home.js`
```javascript
const mvc = require.main.require('@Kldit/mvc');

module.exports = class Home extends mvc.BaseController
{
index(ctx) {
ctx.body = 'Hello World!';
}
}
```

Change your class `MainApplication` in the `app.js`:
```javascript
class MainApplication extends mvc.Application
{
init( koa )
{
super.init( koa );
// Put the name you want and point to the root service folder.
this.loadService( 'my-service', './MyService' );
}
}
```

### Test it
```bash
$ curl localhost:3000/my-service
> Hello World!
```
[More about controllers](extra/CONTROLLER.md)

### Default Service
Change `app.js`
```javascript
this.setDefaultService( 'my-service', './MyService' );
```
And test it. Now your app is at the root path.
```bash
$ curl localhost:3000
> Hello World!
```