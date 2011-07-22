describe('smoax', function() {
  beforeEach(function() {
    this.addMatchers(smoax.setup());
  });
  
  it('gets initialised', function() {
    expect(smoax).not.toHaveBeenInvoked();
    expect(smoax).not.toHaveBeenInvokedWith('post', '/url', {data:false});
  });
  
  it('handles $.get', function() {
    smoax.register('get', '/url', { data: "yeah" });
    var gotSyncCall = false;
    $.get('/url', function(resp) {
      gotSyncCall = true;
      expect(resp.data).toEqual('yeah');
    }, 'json');
    expect(gotSyncCall).toEqual(true);
    expect(smoax).toHaveBeenInvoked();
    expect(smoax).toHaveBeenInvokedWith('get', '/url');
  });
  
  it('handles $.post', function() {
    smoax.register('post', '/url', { data: "yeah" });
    var gotSyncCall = false;
    $.post('/url', { request: true }, function(resp) {
      gotSyncCall = true;
      expect(resp.data).toEqual('yeah');
    }, 'json');
    expect(gotSyncCall).toEqual(true);
    expect(smoax).toHaveBeenInvokedWith('post', '/url', { request:true });
  });
  
  
  it('handles error callback', function() {
    smoax.registerError('get', '/url', 404, 'notfound');
    var successGotCalled = false;
    var errorGotCalled = false;
    $.ajax({ type: 'get', url: '/url', 
      success: function(data) { successGotCalled = true; },
      error: function(xhr, statusText, errorThrown) { 
        errorGotCalled = true;
        expect(xhr.status).toEqual(404);
        expect(statusText).toEqual('error');
        expect(errorThrown).toEqual('notfound');
      }
    });
    expect(successGotCalled).toEqual(false);    
    expect(errorGotCalled).toEqual(true);
    expect(smoax).toHaveBeenInvoked();
    expect(smoax).toHaveBeenInvokedWith('get', '/url');
  });

  it('handles multiple deferred success callbacks', function() {
    smoax.register('get', '/url', { data: "yeah" });
    var calls = 0;
    $.get('/url')
      .success(function() { calls++; })
      .success(function() { calls++; })      
    expect(calls).toEqual(2);
  });

  it('handles multiple deferred error callbacks', function() {
    smoax.registerError('get', '/url', 404, 'notfound');
    var calls = 0;
    $.get('/url')
      .error(function() { calls++; })
      .error(function() { calls++; })      
    expect(calls).toEqual(2);
  });

  it('registers calls and call count', function() {
    smoax.register('get', '/url', { data: "yeah" });
    expect(smoax.calls.map).toEqual({});
    $.get('/url', function() {});
    expect(smoax.calls.map['GET /url']).toBeDefined();
    expect(smoax.calls.count).toEqual(1);
  });
  
  it('can also play async', function() {
    smoax.registerAsync('get', '/url', { data: "yeah" });
    var called = false;
    $.get('/url', function(resp) {
      called = true;
    });
    expect(called).toEqual(false);
    waitsFor(function() { return called; }, 1000);
  });
  
  it('exposes real ajax', function() {
    var response = smoax.ajax({type:'get', url:'../spec/smoax-spec.js', async:false});
    expect(response.responseText).toMatch(/^describe\('smoax/);
  });

  it('can use a string response body', function() {
    smoax.register('get', '/url', 'foo');
    $.get('/url').success(function(data) { expect(data).toEqual('foo'); });
    expect(smoax.calls.count).toEqual(1);
  });

  it('can use a function response body', function() {
    smoax.register('get', '/url', function() { return 'foo'; });
    $.get('/url').success(function(data) { expect(data).toEqual('foo'); });
    expect(smoax.calls.count).toEqual(1);
  });

});