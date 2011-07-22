/*
 TODO: 
 * better warn messages when eg. data doesnt match expected
*/
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
    return this;
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
    opts.originalDataType = opts.dataType;
    opts.dataType = 'mock';
    return me.ajax(opts);
  }

  function _register(method, url, data) {
    me.handlers.set(method, url, data);
    return this;
  }
  this.register = function(method, url, response) {
    var data = { statusCode:200, statusText:'success', response:response };
    return _register(method, url, data);
  }
  this.registerAsync = function(method, url, response) {
    var data = { statusCode:200, statusText:'success', response:response, async:true };
    return _register(method, url, data);
  }
  this.registerError = function(method, url, statusCode, statusText, response) {
    var data = { statusCode:statusCode, statusText:statusText, response:response };
    return _register(method, url, data);
  }
  
  function warn(s) {
    jasmine.getEnv().reporter.log('smoax: '+s);
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
      this.message = function() { return [
          "Expected "+method+" "+url+" to have been invoked.",
          "Expected "+method+" "+url+" not to have been invoked."
      ]; };      
      return match(me.latest, method, url, data);
    },
    toHaveBeenInvokedWith: function(method, url, data) {
      this.message = function() { return [
          "Expected "+method+" "+url+" to have been invoked.",
          "Expected "+method+" "+url+" not to have been invoked."
      ]; };      
      var call = me.calls.get(method, url);
      return match(call, method, url, data);
    }
  }
  
  function match(opts, method, url, data) {
    return !!opts && !!opts.type
      && method.toUpperCase() == opts.type.toUpperCase()
      && url == opts.url
      && toParams(data) == opts.data;
  }
  
  function AjaxMap() {
    this.count = 0;
    this.map = {};
    this.key = function(method, url) {
      return method.toUpperCase()+' '+url;
    }
    this.get = function(method, url) {
      var key = this.key(method, url);
      return this.map[key];
    };
    this.set = function(method, url, data) {
      var key = this.key(method, url);
      if (!this.map[key]) {
        this.count++;
      }
      this.map[key] = data;
    }
    return this;
  }
  
  return this;
};

