// smart-filter api helper
var SF = {
  objSmartFilterCallbacks: {},
  smartFilterRequests: {},
  _preProcess: function(action, parameters, cb) {
    var sfAction = action.toString().toLowerCase();
    if (sfAction.toString().toLowerCase() == 'pivot') {
      this.objSmartFilterCallbacks[parameters.reference + "_" + parameters.data.reference] = cb;
    }
    if (this.smartFilterRequests[parameters.reference] == undefined) {
      this.smartFilterRequests[parameters.reference] = [];
    }

    if (sfAction.toLowerCase() == 'staticfilter' || sfAction.toLowerCase() == 'filter') {
      for (var i = this.smartFilterRequests[parameters.reference].length - 1; i >= 0; i--) {
        try {
          this.smartFilterRequests[parameters.reference][i].abort();
        } catch (ex) {}
      }
      this.smartFilterRequests[parameters.reference] = null;
      this.smartFilterRequests[parameters.reference] = [];
    }
  },
  _postProcess: function(action, parameters, result, cb, addPivotCallback) {
    if (result != undefined && result.content != undefined && result.content.result != undefined && typeof result.content.result.data == 'object') {
      if (result.content.result.type.toLowerCase() == 'data') {
        var keys = Object.keys(result.content.result.data);
        for (var i = 0; i < keys.length; i++) {
          if (this.objSmartFilterCallbacks.hasOwnProperty(parameters.reference + "_" + keys[i])) {
            try {
              var responseData = {};
              responseData.status = result.status;
              responseData.data = result.content.result.data[keys[i]];
              responseData.reference = keys[i];
              this.objSmartFilterCallbacks[parameters.reference + "_" + keys[i]](responseData);
            } catch (ex) {
              console.log(ex);
            }
          }
        }
      } else if (result.content.result.type.toLowerCase() == 'records') {
        if (cb) cb(result.content.result.data);
      } else if (result.content.result.type.toLowerCase() == 'error') {
        console.log(result);
      }

      if (action.toLowerCase() == 'staticfilter') {
        if (cb) cb();
      } else if (action.toLowerCase() == 'filter') {
        if (cb) cb();
      } else if (action.toLowerCase() == 'removepivot') {
        if (cb) cb();
      } else if (action.toLowerCase() == 'flushcache') {
        if (cb) cb();
      } else if (action.toLowerCase() == 'pivot') {
        if (addPivotCallback) addPivotCallback();
      } else if (action.toLowerCase() == 'disconnect') {
        if (cb) cb();
      }
    } else {
      if (cb) cb(result);
    }
  },

  connect: function(host, def, cb) {
    this._preProcess('connect', def, cb);
    $.ajax({
      url: host + '/apis/smartfilter/connect',
      type: 'post',
      data: SF.serialize(def)
    }).always(function(data) {
      if (data.status === true && data.content != undefined && data.content.result != undefined && data.content.result.reference != undefined && SF.socket != undefined) {
        SF.socket.emit('addSFConnection', data.content.result.reference);
      }
      SF._postProcess('connect', def, data, cb);
    });
  },
  pivot: function(host, def, cb, addPivotCallback) {
    this._preProcess('pivot', def, cb);
    $.ajax({
      url: host + '/apis/smartfilter/pivot',
      type: 'post',
      data: SF.serialize(def)
    }).always(function(data) {
      SF._postProcess('pivot', def, data, cb, addPivotCallback);
    });
  },
  filter: function(host, def, cb) {
    this._preProcess('filter', def, cb);
    $.ajax({
      url: host + '/apis/smartfilter/filter',
      type: 'post',
      data: SF.serialize(def)
    }).always(function(data) {
      SF._postProcess('filter', def, data, cb);
    });
  },
  staticFilter: function(host, def, cb) {
    this._preProcess('staticFilter', def, cb);
    $.ajax({
      url: host + '/apis/smartfilter/staticFilter',
      type: 'post',
      data: SF.serialize(def)
    }).always(function(data) {
      SF._postProcess('staticFilter', def, data, cb);
    });
  },
  data: function(host, def, cb) {
    this._preProcess('data', def, cb);
    $.ajax({
      url: host + '/apis/smartfilter/data',
      type: 'post',
      data: SF.serialize(def)
    }).always(function(data) {
      SF._postProcess('data', def, data, cb);
    });
  },
  serialize: function(json) {
    return { serializedData: JSON.stringify(json) };
  },
  flushCache: function(host, def, cb) {
    this._preProcess('flushCache', def, cb);
    $.ajax({
      url: host + '/apis/smartfilter/flushCache',
      type: 'post',
      data: SF.serialize(def)
    }).always(function(data) {
      SF._postProcess('flushCache', def, data, cb);
    });
  },
  disconnect: function(host, def, cb) {
    this._preProcess('disconnect', def, cb);
    $.ajax({
      url: host + '/apis/smartfilter/disconnect',
      type: 'post',
      data: SF.serialize(def)
    }).always(function(data) {
      SF._postProcess('disconnect', def, data, cb);
    });
  },
  removepivot: function(host, def, cb) {
    this._preProcess('disconnect', def, cb);
    $.ajax({
      url: host + '/apis/smartfilter/removePivot',
      type: 'post',
      data: SF.serialize(def)
    }).always(function(data) {
      SF._postProcess('removePivot', def, data, cb);
    });
  }
};
if (typeof io == "undefined") {
  throw Error("Socket not included");
} else {
  SF.socket = io();
}
