describe('smoax', function() {
  beforeEach(function() {
    this.addMatchers(smoax.setup())
  })
  
  it('gets initialised', function() {
    expect(smoax).not.toHaveBeenInvoked()
    expect(smoax).not.toHaveBeenInvokedWith('post', '/url', {data:false})
  })
  
  it('handles $.get', function() {
    smoax.register('get', '/url', { data: "yeah" })
    var gotSyncCall = false
    $.get('/url', function(resp) {
      gotSyncCall = true
      expect(resp.data).toEqual('yeah')
    }, 'json')
    expect(gotSyncCall).toEqual(true)
    expect(smoax).toHaveBeenInvoked()
    expect(smoax).toHaveBeenInvokedWith('get', '/url')
    expect(smoax).not.toHaveBeenInvokedWith('get', '/urlX')
  })
  
  it('handles $.post', function() {
    smoax.register('post', '/url', { data: "yeah" })
    var gotSyncCall = false
    $.post('/url', { request: true }, function(resp) {
      gotSyncCall = true
      expect(resp.data).toEqual('yeah')
    }, 'json')
    expect(gotSyncCall).toEqual(true)
    expect(smoax).toHaveBeenInvokedWith('post', '/url', { request:true })
    expect(smoax).not.toHaveBeenInvokedWith('post', '/url', { request:false })
  })
  
  
  it('handles error callback', function() {
    smoax.registerError('get', '/url', 404, 'notfound')
    var successGotCalled = false
    var errorGotCalled = false
    $.ajax({ type: 'get', url: '/url', 
      success: function(data) { successGotCalled = true },
      error: function(xhr, statusText, errorThrown) { 
        errorGotCalled = true
        expect(xhr.status).toEqual(404)
        expect(statusText).toEqual('error')
        expect(errorThrown).toEqual('notfound')
      }
    })
    expect(successGotCalled).toEqual(false)
    expect(errorGotCalled).toEqual(true)
    expect(smoax).toHaveBeenInvoked()
    expect(smoax).toHaveBeenInvokedWith('get', '/url')
  })

  it('handles multiple deferred success callbacks', function() {
    smoax.register('get', '/url', { data: "yeah" })
    var calls = 0
    $.get('/url')
      .success(function() { calls++ })
      .success(function() { calls++ })
    expect(calls).toEqual(2)
  })

  it('handles multiple deferred error callbacks', function() {
    smoax.registerError('get', '/url', 404, 'notfound')
    var calls = 0
    $.get('/url')
      .error(function() { calls++ })
      .error(function() { calls++ })
    expect(calls).toEqual(2)
  })

  it('registers calls and call count', function() {
    smoax.register('get', '/url', { data: "yeah" })
    expect(smoax.calls.map).toEqual({})
    $.get('/url', function() {})
    expect(smoax.calls.map['GET /url']).toBeDefined()
    expect(smoax.calls.count).toEqual(1)
  })

  it('keeps track of latest ajax call', function() {
    $.get('/url', { 'im':'latest' }, function() {})
    expect(smoax.latest).toBeDefined()
    expect(smoax.latest.type).toEqual('GET')
    expect(smoax.latest.url).toEqual('/url?im=latest')
  })


  it('can also play async', function() {
    smoax.registerAsync('get', '/url', { data: "yeah" })
    var response = undefined, duration = undefined, pre = (new Date()).getTime()
    $.get('/url', function(resp) {
      duration = (new Date()).getTime() - pre
      response = resp
    }, 'json')
    expect(response).not.toBeDefined()
    waitsFor(function() { return !!response }, 1000)
    runs(function() {
      expect(response.data).toEqual('yeah')
      expect(duration).toBeLessThan(20)
    })
  })

  it('can delay when async', function() {
    smoax.registerAsync('get', '/url', 'slowly', 100)
    var response = undefined, duration = undefined, pre = (new Date()).getTime()
    $.get('/url', function(resp) {
      duration = (new Date()).getTime() - pre
      response = resp
    })
    waitsFor(function() { return !!response }, 1000)
    runs(function() {
      expect(response).toEqual('slowly')
      expect(duration).toBeGreaterThan(100)
    })
  })


  it('exposes real ajax', function() {
    if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1 && document.location.protocol == 'file:') {
      jasmine.log('This test fails with google-chrome if not started with --allow-file-access-from-files')
    }
    var response = smoax.ajax({type:'get', url:'../spec/jasmine-test.js', async:false})
    expect(response.responseText).toMatch(/^describe\('smoax/)
  })

  it('can use a string response body', function() {
    smoax.register('get', '/url', 'foo')
    $.get('/url').success(function(data) { expect(data).toEqual('foo') })
    expect(smoax.calls.count).toEqual(1)
  })

  it('can use a function response body', function() {
    smoax.register('get', '/url', function() { return 'foo' })
    $.get('/url').success(function(data) { expect(data).toEqual('foo') })
    expect(smoax.calls.count).toEqual(1)
  })

  it('can assert latest ajax', function() {
    $.post('/first', { foo:'bar' })
    $.post('/second', { data:'ok' })
    expect(smoax).latestInvocationToHaveBeen('POST', '/second', { data:'ok'})
    $.get('/third')
    expect(smoax).latestInvocationToHaveBeen('GET', '/third')
  })

  it('uses readable error messages when method and url doesnt match expected', function() {
    $.get('/first')
    $.post('/second')
    var obj = {}
    var result = smoax.jasmineMatchers.toHaveBeenInvokedWith.call(obj, 'get', '/second')
    expect(result).toEqual(false)
    expect(obj.message()[0]).toEqual('Expected GET /second to have been invoked. There have been calls to: GET /first, POST /second')
    expect(obj.message()[1]).toEqual('Expected GET /second not to have been invoked. There have been calls to: GET /first, POST /second')
  })

  it('uses readable error messages when data doesnt match expected', function() {
    $.post('/second', { data:'ok' })
    var obj = {}
    var result = smoax.jasmineMatchers.toHaveBeenInvokedWith.call(obj, 'post', '/second', { data:'fail' })
    expect(result).toEqual(false)
    expect(obj.message()[0]).toEqual("Expected POST /second to have been invoked with 'data=fail' but was invoked with 'data=ok'")
    expect(obj.message()[1]).toEqual("Expected POST /second not to have been invoked with 'data=fail'")
  })

  it('releases $.ajax', function() {
    expect($.ajax.toString().length).toBeLessThan(200)
    smoax.release()
    expect($.ajax.toString().length).toBeGreaterThan(3000)
  })
})