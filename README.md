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
