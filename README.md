# Smoax: Simple Mock Ajax For Jasmine + jQuery

*  Requires Jasmine 1.0.2+ and jQuery 1.6+.
*  Works with both ye-olde-style ajax success and error handlers and jQuery 1.5 deferreds.

## Usage

1.  Download [jasmine-smoax.js](https://raw.github.com/mtkopone/smoax/master/jasmine-smoax.js)
2.  Add it to the Jasmine SpecRunner.html:

        <script src="jasmine-smoax.js"></script>

3.  Use it:

        describe('my spec', function() {
            beforeEach(function() {
                // Initialise smoax and register the matchers
                this.addMatchers(smoax.setup());
            });
            it('calls some ajax stuff', function() {
                // Register expected ajax calls and the responses that they should return
                smoax.register('GET', '/my/url.json', { data:'yeah' });
                // Call the javascript-under-test that invokes ajax
                myProductionCode.someMethod();
                // Check that appropriate ajax calls were invoked
                expect(smoax).toHaveBeenInvokedWith('get', '/my/url.json');
            });
        });

See the [tests](https://github.com/mtkopone/smoax/blob/master/spec/smoax-spec.js) for more examples of usage.

## Details, details

`smoax.register(method, url, responseData)` takes three parameters:

1.  The HTTP method: GET, POST, PUT, etc.
2.  The URL of the request
3.  A response body to provide when the the ajax gets invoked. This can be either a string, a javascript object or a function that returns one of the previous types.

`this.addMatchers(smoax.setup())` registers the following Jasmine matchers:

*  `expect(smoax).toHaveBeenInvoked()`
    
    checks that some ajax got called.

*  `expect(smoax).toHaveBeenInvokedWith(method, url, data)`

    checks that an ajax call with the given parameters was called.

*  `expect(smoax).latestInvocationToHaveBeen(method, url, data)`

    checks that the latest ajax call matches the parameters.

`smoax.registerError(method, url, statusCode, statusText, responseData)` may be used to test error conditions. It takes the following parameters:

1.  The HTTP method: GET, POST, PUT, etc.
2.  The URL of the request
3.  The HTTP status code to return  
4.  The HTTP status text to return
5.  A response body to provide when the the ajax gets invoked. This can be either a string, a javascript object or a function that returns one of the previous types.

`smoax.calls` contains details of all intercepted ajax calls and a `count` variable telling how many ajax calls have been intercepted.

By default, smoax *synchronously* calls the success and error handlers of an ajax invocation. This is generally good enough, and simplifies test writing by not requiring all test code to be within `runs()` and `waitsFor()` blocks. In some special cases, asynchronous behaviour could be required, and can be enabled by using `smoax.registerAsync()`. It takes the same arguments as `smoax.register()`.

Use `smoax.ajax()` instead of `$.ajax()` to access a non-mocked version of `jQuery.ajax()` to e.g. load example data from files.



Enjoy,

