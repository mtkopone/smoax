var expect = chai.expect

describe('smoax', function() {
  beforeEach(function() {
    chai.use(smoax.setup())
  })
  afterEach(function() {
    smoax.release()
  })

  it('gets initialised', function() {
    expect(smoax).not.to.have.beenInvoked()
    expect(smoax).not.to.have.beenInvokedWith('post', '/url', {data:false})
  })

  it('handles $.get', function() {
    smoax.register('get', '/url', { data: "yeah" })
    var gotSyncCall = false
    $.get('/url', function(resp) {
      gotSyncCall = true
      expect(resp.data).to.equal('yeah')
    }, 'json')
    expect(gotSyncCall).to.equal(true)
    expect(smoax).to.have.beenInvoked()
    expect(smoax).to.have.beenInvokedWith('get', '/url')
    expect(smoax).not.to.have.beenInvokedWith('get', '/urlX')
  })

  it('handles $.post', function() {
    smoax.register('post', '/url', { data: "yeah" })
    var gotSyncCall = false
    $.post('/url', { request: true }, function(resp) {
      gotSyncCall = true
      expect(resp.data).to.equal('yeah')
    }, 'json')
    expect(gotSyncCall).to.equal(true)
    expect(smoax).to.have.beenInvokedWith('post', '/url', { request:true })
    expect(smoax).not.to.have.beenInvokedWith('post', '/url', { request:false })
  })

  it('handles error callback', function() {
    smoax.registerError('get', '/url', 404, 'notfound')
    var successGotCalled = false
    var errorGotCalled = false
    $.ajax({ type: 'get', url: '/url',
      success: function() { successGotCalled = true },
      error: function(xhr, statusText, errorThrown) {
        errorGotCalled = true
        expect(xhr.status).to.equal(404)
        expect(statusText).to.equal('error')
        expect(errorThrown).to.equal('notfound')
      }
    })
    expect(successGotCalled).to.equal(false)
    expect(errorGotCalled).to.equal(true)
    expect(smoax).to.have.beenInvoked()
    expect(smoax).to.have.beenInvokedWith('get', '/url')
  })

  it('handles multiple deferred success callbacks', function() {
    smoax.register('get', '/url', { data: "yeah" })
    var calls = 0
    $.get('/url')
        .success(function() { calls++ })
        .success(function() { calls++ })
    expect(calls).to.equal(2)
  })

  it('handles multiple deferred error callbacks', function() {
    smoax.registerError('get', '/url', 404, 'notfound')
    var calls = 0
    $.get('/url')
        .error(function() { calls++ })
        .error(function() { calls++ })
    expect(calls).to.equal(2)
  })

  it('registers calls and call count', function() {
    smoax.register('get', '/url', { data: "yeah" })
    expect(smoax.calls.map).to.eql({})
    $.get('/url', function() {})
    expect(smoax.calls.map['GET /url']).to.exist
    expect(smoax.calls.count).to.equal(1)
  })

  it('keeps track of latest ajax call', function() {
    $.get('/url', { 'im':'latest' }, function() {})
    expect(smoax.latest).to.exist
    expect(smoax.latest.type).to.equal('GET')
    expect(smoax.latest.url).to.equal('/url?im=latest')
  })

  it('can also play async', function(done) {
    smoax.registerAsync('get', '/url', { data: "yeah" })
    var pre = (new Date()).getTime()
    $.get('/url', function(resp) {
      var duration = (new Date()).getTime() - pre
      expect(duration).to.be.below(20)
      expect(resp.data).to.equal('yeah')
      done()
    }, 'json')
  })

  it('can delay when async', function(done) {
    smoax.registerAsync('get', '/url', 'slowly', 50)
    var pre = (new Date()).getTime()
    $.get('/url', function(resp) {
      var duration = (new Date()).getTime() - pre
      expect(duration).to.be.above(50)
      expect(resp).to.equal('slowly')
      done()
    })
  })

  it('exposes real ajax', function() {
    if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1 && document.location.protocol == 'file:') {
      console.log('This test fails with google-chrome if not started with --allow-file-access-from-files')
    }
    var response = smoax.ajax({type:'get', url:'../test/jasmine-test.js', async:false})
    expect(response.responseText).to.match(/^describe\('smoax/)
  })

  it('can use a string response body', function() {
    smoax.register('get', '/url', 'foo')
    $.get('/url').success(function(data) { expect(data).to.equal('foo') })
    expect(smoax.calls.count).to.equal(1)
  })

  it('can use a function response body', function() {
    smoax.register('get', '/url', function() { return 'foo' })
    $.get('/url').success(function(data) { expect(data).to.equal('foo') })
    expect(smoax.calls.count).to.equal(1)
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
    var assertion = undefined
    var obj = { assert: function(ok, m1, m2) { assertion = [ok, m1, m2] }}
    chai.Assertion.prototype.beenInvokedWith.call(obj, 'get', '/second')
    expect(assertion[0]).to.be.false
    expect(assertion[1]).to.equal('Expected GET /second to have been invoked. There have been calls to: GET /first, POST /second')
    expect(assertion[2]).to.equal('Expected GET /second not to have been invoked. There have been calls to: GET /first, POST /second')
  })

  it('uses readable error messages when data doesnt match expected', function() {
    $.post('/second', { data:'ok' })
    var assertion = undefined
    var obj = { assert: function(ok, m1, m2) { assertion = [ok, m1, m2] }}
    chai.Assertion.prototype.beenInvokedWith.call(obj, 'post', '/second', { data:'fail' })
    expect(assertion[0]).to.be.false
    expect(assertion[1]).to.equal("Expected POST /second to have been invoked with 'data=fail' but was invoked with 'data=ok'")
    expect(assertion[2]).to.equal("Expected POST /second not to have been invoked with 'data=fail'")
  })

  it('releases $.ajax', function() {
    expect($.ajax.toString()).to.have.length.below(200)
    smoax.release()
    expect($.ajax.toString()).to.have.length.above(3000)
  })
})

