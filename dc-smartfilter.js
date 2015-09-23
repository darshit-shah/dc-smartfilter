(function () {
    function _dc_sf() {
        'use strict';
        function dc_sf() {
            /*****************************************************************************************************************************************************************/
            /*****************************************************************************************************************************************************************/
            /****************************************************                                             ****************************************************************/
            /****************************************************        Start Axiom API Part                 ****************************************************************/
            /****************************************************                                             ****************************************************************/
            /*****************************************************************************************************************************************************************/
            /*****************************************************************************************************************************************************************/

            var _smartfilter = {};
            /* Axiom APIs to connect to a table*/
            _smartfilter.connect = function (sfRef, viewID, callback) {
                AxiomAPIs.smartFilter({ action: "connect", reference: sfRef, viewID: viewID }, function (data) {
                    callback(data);
                });
            };

            /* Axiom APIs to create a pivot*/
            _smartfilter.pivot = function (sfRef, pivotRef, dimensions, measures, callback) {
                AxiomAPIs.smartFilter({ action: "pivot", reference: sfRef, data: { reference: pivotRef, dimensions: dimensions, measures: measures} }, function (pivotData) {
                    callback(pivotRef, pivotData);
                });
            };

            /* Axiom APIs to create a filter*/
            _smartfilter.filter = function (sfRef, field, filterType, filters, callback) {
                AxiomAPIs.smartFilter({ action: "filter", reference: sfRef, data: { field: field, filters: filters, filterType: filterType} }, function () {
                    callback();
                });
            };

            /* Block all connected UI component */
            _smartfilter.block = function (component) {
                if (typeof $.blockUI == 'function') {
                    component.block({ message: null });
                }
            }

            /* Unblock all connected UI component */
            _smartfilter.unblock = function (component) {
                component.unblock();
            }

            /*****************************************************************************************************************************************************************/
            /*****************************************************************************************************************************************************************/
            /****************************************************                                             ****************************************************************/
            /****************************************************        End Axiom API Part                   ****************************************************************/
            /****************************************************                                             ****************************************************************/
            /*****************************************************************************************************************************************************************/
            /*****************************************************************************************************************************************************************/

            var _sf = {}
            if (arguments.length == 3) {
                _sf.reference = arguments[0];
                _sf.viewID = arguments[1];
                _sf.connectCallback = arguments[2];
                _smartfilter.connect(_sf.reference, _sf.viewID, function (data) {
                    if (data.status == false) {
                        console.error(data);
                    }
                    else {
                        if (data.content.result.type == 'errorMessage') {
                            console.error(data.content.result.data);
                        }
                        else {
                            _sf.connectCallback(data);
                        }
                    }
                });
            }
            else {
                console.log("Provide reference, view and callback in constructor");
                return;
            }
            _sf._dataChanged = true;

            function _filterChanged() {
                _sf._dataChanged = true;
                cbCounter = -1000000;
                console.log('filter changed ', new Date().getTime());
                _fetchData();
            }

            function _getFilters() {
                _sf.result = {};
                var list = dc.chartRegistry.list();
                //for (var e in list) {
                list.forEach(function (chart, index) {
                    _sf.result[index] = chart.filters()
                });
                //}
                return _sf.result;
            }

            var cbCounter = 0;
            var cbTotal = 0;

            var _lastFilters = {};
            _sf.results = {};
            function _fetchDataFor(filters, cb) {
                cbTotal = Object.keys(filters).length;
                _sf.results = {};
                console.log('in theory we go get data for ', filters)
                _checkAndApplyFilter(0, filters, cb);
                return _sf.results;
            }

            function _checkAndApplyFilter(currentIndex, filters, cb) {
                var keys = Object.keys(filters);
                if (currentIndex >= keys.length) {
                    //done
                    _lastFilters = $.extend(true, {}, filters);
                    cb();
                }
                else {
                    //no filter in this key
                    if (filters[keys[currentIndex]].length == 0) {
                        if (_lastFilters[keys[currentIndex]] == undefined || _lastFilters[keys[currentIndex]].length == 0) {
                            //do nothing.
                            _checkAndApplyFilter(currentIndex + 1, filters, cb);
                        }
                        else {
                            //remove filter
                            _smartfilter.filter(_sf.reference, _pivots[currentIndex].definition.dimensions[0].key, 'in', filters[keys[currentIndex]], function () {
                                _checkAndApplyFilter(currentIndex + 1, filters, cb);
                            });
                        }
                    }
                    //some filter is there in this key
                    else {
                        if (_lastFilters[keys[currentIndex]] == undefined || _lastFilters[keys[currentIndex]].length == 0) {
                            //add filter
                            _smartfilter.filter(_sf.reference, _pivots[currentIndex].definition.dimensions[0].key, 'in', filters[keys[currentIndex]], function () {
                                _checkAndApplyFilter(currentIndex + 1, filters, cb);
                            });
                        }
                        else {
                            if (filters[keys[currentIndex]].join(",") == _lastFilters[keys[currentIndex]].join(",")) {
                                //do nothing
                                _checkAndApplyFilter(currentIndex + 1, filters, cb);
                            }
                            else {
                                //changed filter
                                _smartfilter.filter(_sf.reference, _pivots[currentIndex].definition.dimensions[0].key, 'in', filters[keys[currentIndex]], function () {
                                    _checkAndApplyFilter(currentIndex + 1, filters, cb);
                                });
                            }
                        }
                    }
                }
            }

            function updateResult(chartId, data) {
                if (data.status == false) {
                    console.error(data);
                }
                else {
                    _sf.results[chartId] = data.data;
                }
                cbCounter++;
                if (cbCounter >= _pivots.length) {
                    _renderCharts();
                }
            }

            function _fetchData() {
                if (_sf._dataChanged) {
                    _pivots.forEach(function (e) {
                        _smartfilter.block(e.component);
                    });
                    _sf._dataChanged = false; // no more fetches, until a chart has had another filter applied.
                    var filters = _getFilters();
                    // ok we have the data we will send to the server....
                    console.log('fetch data for called from fetch data');
                    _sf.results = _fetchDataFor(filters, function () {
                        _renderCharts();
                    });
                }
            }

            function _renderCharts() {
                console.log('_renderCharts');
                var list = dc.chartRegistry.list();
                for (var e in _sf.results) {
                    //                    for (var x in list) {
                    //                        if (list[x].chartID() == e) {
                    var chart = list[e];
                    var group = chart.group();
                    group._currentData = _sf.results[e];
                    //                        }
                    //                    }
                }
                console.log('dc.renderAll');
                dc.renderAll();
                _pivots.forEach(function (e) {
                    _smartfilter.unblock(e.component);
                });
            }

            _sf._fetchData = _fetchData;
            _sf._fetchDataFor = _fetchDataFor;
            _sf._getFilters = _getFilters;

            var _pivots = [];
            _sf.addPivot = function (dimensions, measures, selector) {
                if (dimensions.length == 0 && measures.length == 0) {
                    console.error("Please provide dimension or measure");
                    return;
                }

                var _pivot = {};
                _pivot.dimension = {}

                _pivot.dimension.filter = _filterChanged;
                _pivot.dimension.filterExact = _filterChanged;
                _pivot.dimension.filterRange = _filterChanged;
                _pivot.dimension.filterFunction = _filterChanged;
                _pivot.dimension.filterAll = _filterChanged;
                _pivot.group = function () {
                    return {
                        _currentData: [],
                        all: function () {
                            return this._currentData;
                        },
                        top: function (e) {
                            return this._currentData;
                        }
                    }
                }

                _pivot.definition = { dimensions: dimensions, measures: measures };
                if (typeof selector == 'string')
                    _pivot.component = $(selector);
                else
                    _pivot.component = selector;
                _pivots.push(_pivot);

                cbCounter = 0;
                _smartfilter.pivot(_sf.reference, _pivots.length - 1, dimensions, measures, updateResult);

                _pivots.forEach(function (e) {
                    _smartfilter.block(e.component);
                });

                return _pivot;
            }

            return _sf;
        }
        return dc_sf;
    }
    if (typeof define === "function" && define.amd) {
        define([], _dc_sf);
    } else if (typeof module === "object" && module.exports) {
        module.exports = _dc_sf();
    } else {
        this.dc_sf = _dc_sf();
    }
}
)();