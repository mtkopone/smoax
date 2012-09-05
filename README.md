# Smoax: Simple Mock Ajax for jQuery
## for Mocha + Chai and Jasmine

*  Requires jQuery 1.6+ and either Jasmine 1.0.2+ or some recent Mocha + Chai setup.
*  Works with both ye-olde-style ajax success and error handlers and jQuery 1.5 deferreds.

# But Why?

Yeah, the world is full of ways to mock jQuery $.ajax.

Most of them do too much. I want jQuery itself to handle response content types, fire globally registered callbacks and such.
So, instead of completely replacing $.ajax, smoax just provides an alternative ajax transport to jQuery and a tiny wrapper function around $.ajax to mark requests as going to said transport.

# Get It

Download [smoax.js](https://raw.github.com/mtkopone/smoax/master/smoax.js)

## Mocha + Chai Usage

Add smoax.js to your test runner html:

```html
<script src="smoax.js"></script>
```

Use it:

```javascript
var expect = chai.expect

describe('my spec', function() {
    beforeEach(function() {
        // Initialise smoax and register the matchers
        chai.use(smoax.setup())
    });
    afterEach(function() {
        // Revert $.ajax to a real ajax implementation
        smoax.release()
    })
    it('calls some ajax stuff', function() {
        // Register expected ajax calls and the responses that they should return
        smoax.register('GET', '/my/url.json', { data:'yeah' });
        // Call the javascript-under-test that invokes ajax
        myProductionCode.someMethod();
        // Check that appropriate ajax calls were invoked
        expect(smoax).to.have.beenInvokedWith('get', '/my/url.json');
    });
});
```

See the [tests](https://github.com/mtkopone/smoax/blob/master/test/mocha-test.js) for more examples of usage.

### Chai Expect Matchers

`chai.use(smoax.setup())` registers the following expect matchers:

*  `expect(smoax).to.have.beenInvoked()`

    checks that some ajax got called.

*  `expect(smoax).to.have.beenInvokedWith(method, url, data)`

    checks that an ajax call with the given parameters was called.

*  `expect(smoax).latestInvocationToHaveBeen(method, url, data)`

    checks that the latest ajax call matches the parameters.


## Jasmine Usage

Add smoax.js to the Jasmine SpecRunner.html:

```html
<script src="smoax.js"></script>
```

Use it:

```javascript
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
```

See the [tests](https://github.com/mtkopone/smoax/blob/master/test/jasmine-test.js) for more examples of usage.

### Jasmine Matchers

`this.addMatchers(smoax.setup())` registers the following Jasmine matchers:

*  `expect(smoax).toHaveBeenInvoked()`
    
    checks that some ajax got called.

*  `expect(smoax).toHaveBeenInvokedWith(method, url, data)`

    checks that an ajax call with the given parameters was called.

*  `expect(smoax).latestInvocationToHaveBeen(method, url, data)`

    checks that the latest ajax call matches the parameters.

## Details, Details

`smoax.register(method, url, responseData)` takes three parameters:

1.  The HTTP method: GET, POST, PUT, etc.
2.  The URL of the request
3.  A response body to provide when the the ajax gets invoked. This can be either a string, a javascript object or a function that returns one of the previous types.

`smoax.registerError(method, url, statusCode, statusText, responseData)` may be used to test error conditions. It takes the following parameters:

1.  The HTTP method: GET, POST, PUT, etc.
2.  The URL of the request
3.  The HTTP status code to return  
4.  The HTTP status text to return
5.  A response body to provide when the the ajax gets invoked. This can be either a string, a javascript object or a function that returns one of the previous types.

`smoax.register()` and `smoax.registerError()` can also be used without the `method` and `url` parameters, in which case the response is used as a reply to all ajax calls.

`smoax.calls` contains details of all intercepted ajax calls and a `count` variable telling how many ajax calls have been intercepted.

`smoax.release()` reverts `$.ajax` back to it's original form.

By default, smoax *synchronously* calls the success and error handlers of an ajax invocation. This is generally good enough, and simplifies test writing by not requiring all test code to become asyncronous. In some special cases, asynchronous behaviour might be nice, and can be enabled with:
`smoax.registerAsync(method, url, responseData, timeout)` and `smoax.registerAsyncError(method, url, statusCode, statusText, responseData, timeout)`
The arguments are the same as for `smoax.register` and `smoax.registerError`, with an optional delay in milliseconds to wait before sending the response. Defaults to 0.

Also, use `smoax.ajax()` instead of `$.ajax()` to access a non-mocked version of `jQuery.ajax()` during tests to e.g. load example data from files.

## ---

Enjoy,

