
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
> Setup  9.95 MB
```

### Test it
```bash
$ curl localhost:3000
> Kldit::MVC
```

[Continue: Your first service](https://webdefault.com.br/kldit-mvc/docs/tutorial-Your%20first%20service.html)