var smoax = new Smoax();

function Smoax() {
  var me = this;
  this.ajax = $.ajax;
  $.ajaxTransport('mock', mockAjaxTransport);
  
  this.setup = function() {
    this.latest = undefined;
    this.handlers = new AjaxMap();
    this.calls = new AjaxMap();
    spyOn($, 'ajax').andCallFake(wrap);
    return this.matchers;
  }
  
  function mockAjaxTransport(options, originalOptions, jqXHR) {
    var abort = false;
    options.dataType = originalOptions.originalDataType;
    options.dataTypes = options.dataType && [options.dataType] || ['*'];
    return {
      send: function(headers, complete) {
        if (abort) return;
        me.latest = options;
        me.calls.set(options.type, options.url, options);
        var handler = me.handlers.get(options.type, options.url);
        if (!!handler) {
          var responses = { text:toText(handler.response) }; 
          //, xml:jQuery.parseXML(handler.response) };
          function done() {
            complete(handler.statusCode, handler.statusText, responses, '');              
          }          
          if (handler.async && options.async) {
            setTimeout(done, 0);
          } else {
            done();
          }
        } else {
          warn('No mock ajax registered for '+options.type+' '+options.url);
        }
      },
      abort: function() { abort = true; }
    };
  }

  function toParams(data) {
    if ($.isFunction(data)) {
      data = data();
    } 
    if ($.isArray(data) || $.isPlainObject(data)) {
      return jQuery.param(data, jQuery.ajaxSettings.traditional);
    } else {
      return data;
    }
  }

  function toText(resp) {
    if ($.isFunction(resp)) {
      resp = resp();
    }
    if ($.isArray(resp) || $.isPlainObject(resp)) {
      return JSON.stringify(resp);
    } else {
      return resp;
    }
  }

  function wrap(opts) {
    var allOpts = jQuery.ajaxSetup({}, opts)
    opts.originalDataType = allOpts.dataType;
    opts.dataType = 'mock';
    return me.ajax(opts);
  }

  function _register(method, url, data) {
    me.handlers.set(method, url, data);
    return this;
  }
  this.register = function(method, url, response) {
    if (!url) { response = method; method = url = '*'; }
    var data = { statusCode:200, statusText:'success', response:response };
    return _register(method, url, data);
  }
  this.registerAsync = function(method, url, response) {
    if (!url) { response = method; method = url = '*'; }
    var data = { statusCode:200, statusText:'success', response:response, async:true };
    return _register(method, url, data);
  }
  this.registerError = function(method, url, statusCode, statusText, response) {
    if (!statusText) { response = statusCode; statusText = url; statusCode = method; method = url = '*'; }
    var data = { statusCode:statusCode, statusText:statusText, response:response };
    return _register(method, url, data);
  }
  
  function warn(s) {
    jasmine.log('smoax: '+s);
  }
  
  this.matchers = {
    toHaveBeenInvoked: function() {
      this.message = function() { return [
          "Expected ajax to have been invoked.",
          "Expected ajax not to have been invoked."
      ]; };      
      return me.latest !== undefined;
    },
    latestInvocationToHaveBeen: function(method, url, data) {
      return match(this, me.latest, method, url, data);
    },
    toHaveBeenInvokedWith: function(method, url, data) {
      var call = me.calls.get(method, url);
      return match(this, call, method, url, data);
    }
  }

  function requestErrorMessages(method, url) {
    function calls2string() {
      var s = '';
      for (var key in me.calls.map) { s == '' ? s = key : s = s + ', ' + key; };
      return s;
    }
    return function() {
      var desc = key(method, url);
      var details = me.calls.count == 0
        && 'There have been no ajax calls.'
        || 'There have been calls to: '+calls2string();
      return [
        "Expected "+desc+" to have been invoked. "+details,
        "Expected "+desc+" not to have been invoked. "+details
    ]; };
  }
  function dataErrorMessages(method, url, actualData, expectedData) {
    var desc = key(method, url);
    return function() { return [
      "Expected "+desc+" to have been invoked with "+jasmine.pp(expectedData)+" but was invoked with "+jasmine.pp(actualData),
      "Expected "+desc+" not to have been invoked with "+jasmine.pp(expectedData)
    ]; };
  }
  
  function match(that, opts, method, url, data) {
    var requestMatch =  !!opts && !!opts.type
      && method.toUpperCase() == opts.type.toUpperCase()
      && url == opts.url.replace(/\?_=\d+/, '');
   var expectedData = toParams(data);
   var dataMatch = !!opts && expectedData == opts.data;
   if (!requestMatch) {
     that.message = requestErrorMessages(method, url);
   } else if (!dataMatch) {
     that.message = dataErrorMessages(method, url, opts.data, expectedData);
   }
   return requestMatch && dataMatch;
  }

  function key(method, url) {
    return method.toUpperCase()+' '+url.replace(/\?_=\d+/, '');
  }
  
  function AjaxMap() {
    this.count = 0;
    this.map = {};

    this.get = function(method, url) {
      return this.map[key(method, url)] || this.map['* *'];
    };
    this.set = function(method, url, data) {
      var k = key(method, url);
      if (!this.map[k]) {
        this.count++;
      }
      this.map[k] = data;
    }
    return this;
  }
  
  return this;
};

