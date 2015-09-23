"use strict";
function index() {
    var dataTable = dc.pieChart("#dc-table-graph");
    var magnitudeChart = dc.pieChart("#dc-magnitude-chart");
    var depthChart = dc.pieChart("#dc-depth-chart");
    var dayOfWeekChart = dc.pieChart("#dc-time-chart");

    var dc_sfObj = dc_sf("reference1", 1212, function (data) {
        var pivot1 = dc_sfObj.addPivot([{ key: "OrganizationType", alias: 'key'}], [{ key: 'ApplicationId', aggregation: 'count', alias: 'value'}], "#dc-table-graph");
        var pivot2 = dc_sfObj.addPivot([{ key: "EnterpriseCategoryName", alias: 'key'}], [{ key: 'ApplicationId', aggregation: 'count', alias: 'value'}], "#dc-magnitude-chart");
        var pivot3 = dc_sfObj.addPivot([{ key: "AreaName", alias: 'key'}], [{ key: 'ApplicationId', aggregation: 'count', alias: 'value'}], "#dc-depth-chart");
        var pivot4 = dc_sfObj.addPivot([], [{ key: 'ApplicationId', aggregation: 'count', alias: 'value'}], "#dc-time-chart");

        dataTable.width(250)
            .height(220)
            .radius(100)
            .innerRadius(30)
            .dimension(pivot1.dimension)
            .group(pivot1.group())
        ;

        magnitudeChart.width(250)
            .height(220)
            .radius(100)
            .innerRadius(30)
            .dimension(pivot2.dimension)
            .group(pivot2.group())
        ;

        depthChart.width(250)
            .height(220)
            .radius(100)
            .innerRadius(30)
            .dimension(pivot3.dimension)
            .group(pivot3.group())
        ;

        dayOfWeekChart.width(250)
            .height(220)
            .radius(100)
            .innerRadius(30)
            .dimension(pivot4.dimension)
            .group(pivot4.group())
        ;

    });
};

$(document).ready(function () {
    AxiomAPIs.onInitialized(function () {
        AxiomAPIs.getAccessToken(function () {
            index();
        });
    });
});