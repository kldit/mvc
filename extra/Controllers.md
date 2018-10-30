## Routing
When a request is made the application tries to find where it should go based on the services names, controller name and methods, all in this order.

### Service name
Considering you have two services, one is the default `whatever-name` and the second, `my-service`. The route for `request.path`will be as follow:
```bash
request.path: /my-service
> service: my-service,
> controller: home,
> method: index
> vars: []
```

If the first `request.path` parameter is not a service, it will be considered a controller from the default service.
```bash
PATH: /my-another-service
> service: whatever-name,
> controller: my-another-service,
> method: index
> vars: []
```

### Controller name
Keeping on the same example but now we have two controllers for our default service. `Home` and `ContactUs`.
```bash
PATH: /contact-us
> service: whatever-name,
> controller: ContactUs,
> method: index
> vars: []
```
Another example, those PATH will be the same results:
```bash
PATH: /
PATH: /home
PATH: /home/index
> service: whatever-name,
> controller: Home,
> method: index
> vars: []
```

### Method name
Now, our `Home` controller has `index` and `about` methods.
```bash
PATH: /about
PATH: /home/about
> service: whatever-name,
> controller: Home,
> method: about
> vars: []
```
Keep in mind, the search order for a name is: service, controller and then a method. In case you have `Home::contactUs` it will never be called from `/contact-us` request.
```bash
PATH: /contact-us
> service: whatever-name,
> controller: ContactUs,
> method: index
> vars: []
```

### Method Any
After all, you can add an `any` method to your controller in order to capture all the requests that does not have a specific method. Considering `ContactUs::any` is created.
```bash
PATH: /contact-us/example
> service: whatever-name,
> controller: ContactUs,
> method: any
> vars: []
```
Be careful when using `Home::any`. More examples:
```bash
PATH: /contact-us/example/value1/value2
> service: whatever-name,
> controller: ContactUs,
> method: any
> vars: ["value1", "value2"]

PATH: /value1/value2
> service: whatever-name,
> controller: Home,
> method: index
> vars: ["value1", "value2"]
```

## Errors
If you want to "re-route" a request to an error 404 you can call inside your controller method `this.app.run404(ctx)`. Or `this.app.runError(ctx)` for other cases.

## preHandle
You can extend this method in your controller to let or not a method be called.
```javascript
class Home extends BaseController
{
	preHandle(ctx)
	{
		ctx.body = "NOOO!";
		return false;
	}
	
	any(ctx)
	{
		ctx.body = "any called";
	}
	
	index(ctx)
	{
		ctx.body = "index called";
	}
	
	test(ctx)
	{
		ctx.body = "test called";
	}
}
```
Examples for requests:
```bash
PATH: /home/test
> NOOO!

PATH: /home/index
> NOOO!

PATH: /home/something-else
> NOOO!
```

You may use it to make a login session.

## Error controller
If a request is not found `Error::error404(ctx)` will be called. General error, `Error::error(ctx)`. You can create your own Error controller, if not, the application will use the one found in `@kldit/mvc/base/controller/Error`.
