**kldit::mvc** is made from the beginning to work with clusters. To activate it, you just have to set true in your `.env` file. It will create as many slave process as cores your system has.

If you need a portion of your application to be single-process, you can create a model as `MASTER_CLUSTER`. This will be placed at your master cluster and all the slaves clusters using this model will receive a "shallow messaging object". 

Those objects have the same methods as the original except they send and receive messages to the master cluster *faking* it is the original one. You can use it to request cached data (without the need of duplication for each slave cluster) or put jobs to be done in another instance of your application. Keep in mind the communication can send only data objects. 

## From PHP to JS
One of the goals of this project is make possible to transit (without losing much) from PHP. MVC is a good way to keep a big project clean and easier to maintenance. Based in things I liked from PHP and even from Java, `kldit::mvc` tries to give you the best of it uppon JS.

While working in Java/Spring, you will have as many "applications"/threads running as the concurrent connections. Knowing it helps you understand a problem of memory usage. Apache/PHP does something similar, but behind the scene. However, even if you are an nice developer using a good framework, you are creating a script running upon `php.so` running upon apache. You have limited control over the server and in many cases you have workaround to created a simple chat, for instance.

**node.js** can give you those things (control, performance and productivity) as soon you understand how it works. It does not have threads and many modules uses async functions to avoid a stop of your applications (like a db connection and request or a load from the web AKA `file_get_contents`. You will write `async` and `await` a lot. Your application is handling all the connections, saving a value at `this` will share it with all the connections, (very different from *running-script-per-connection* you find in PHP). You have to handle the entire request/answer as a context (may I say *context-per-connection*). Short history avoid using `this` at controllers and models, save your session values at the context.

These little design differences makes it gets the best from a single core and less memory consumption. And I hope this project helps you.