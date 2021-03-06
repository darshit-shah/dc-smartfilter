"use strict";
var magnitudeChart = null;
var depthChart = null;
var timeChart = null;
var dayOfWeekChart = null;
var islandChart = null;

function index() {
  //var dataTable = dc.dataTable("#dc-table-graph");
  magnitudeChart = dc.barChart("#dc-magnitude-chart");
  depthChart = dc.barChart("#dc-depth-chart");
  timeChart = dc.lineChart("#dc-time-chart");
  dayOfWeekChart = dc.rowChart("#dc-dayweek-chart");
  islandChart = dc.pieChart("#dc-island-chart");

  var dc_config = {
  	groupReference:{G1:null, G2:null, G3:null},
    apiHost: location.protocol + "//" + location.host,
    configuration: {
      "tableName": "NewZealand_Earthquakes_Data",
      "dbConfig": {
        "type": "database",
        "engine": "infinidb",
        "databaseType": "mysql",
        "database": "my_database",
        "host": "a.b.c.d",
        "port": "3306",
        "user": "my_user",
        "password": "my_password",
        "cacheResponse": false
      }
    }
  }


  var dc_sfObj = dc_sf(dc_config, function(data) {
    var pivot1 = dc_sfObj.addPivot([{ key: "mag", alias: 'key', encloseField: false }], [{ key: 'FID', aggregation: 'count', alias: 'value', encloseField: false }], "#dc-magnitude-chart", "range", "", "G1");
    var pivot2 = dc_sfObj.addPivot([{ key: "depth", alias: 'key', encloseField: false }], [{ key: 'FID', aggregation: 'count', alias: 'value', encloseField: false }], "#dc-depth-chart", "range", "","G2");
    var pivot3 = dc_sfObj.addPivot([{ key: "cast(date_format(dtg1,'%Y-%m-%d %H:00:00') as datetime)", alias: 'key', encloseField: false }], [{ key: 'FID', aggregation: 'count', alias: 'value', encloseField: false }], "#dc-time-chart", "range", "date","G3");
    var pivot4 = dc_sfObj.addPivot([{ key: "cast(date_format(dtg1,'%w.%a') as char)", alias: 'key', encloseField: false }], [{ key: 'FID', aggregation: 'count', alias: 'value', encloseField: false }], "#dc-dayweek-chart", "in", "","G1");
    var pivot5 = dc_sfObj.addPivot([{ key: "(CASE WHEN lat <= -40.555907 && long1 <= 174.590607 THEN 'South' ELSE 'North' END)", alias: 'key', encloseField: false }], [{ key: 'FID', aggregation: 'count', alias: 'value', encloseField: false }], "#dc-island-chart", "in", "","G2");

    magnitudeChart.width(480)
      .height(150)
      .margins({ top: 10, right: 10, bottom: 20, left: 40 })
      .dimension(pivot1.dimension)
      .group(pivot1.group())
      .transitionDuration(500)
      .centerBar(true)
      .gap(65) // 65 = norm
      //    .filter([3, 5])
      .x(d3.scale.linear().domain([0.5, 7.5]))
      .elasticY(true)
      .xAxis().tickFormat();

    // Depth bar graph
    depthChart.width(480)
      .height(150)
      .margins({ top: 10, right: 10, bottom: 20, left: 40 })
      .dimension(pivot2.dimension)
      .group(pivot2.group())
      .transitionDuration(500)
      .centerBar(true)
      .gap(1)
      .x(d3.scale.linear().domain([0, 100]))
      .elasticY(true)
      .xAxis().tickFormat(function(v) {
        return v;
      });

    // time graph
    timeChart.width(960)
      .height(150)
      .transitionDuration(500)
      //    .mouseZoomable(true)
      .margins({ top: 10, right: 10, bottom: 20, left: 40 })
      .dimension(pivot3.dimension)
      .group(pivot3.group())
      //    .brushOn(false)           // added for title
      .title(function(d) {
        return dtgFormat2(d.data.key) + "\nNumber of Events: " + d.data.value;
      })
      .elasticY(true)
      .x(d3.time.scale().domain([new Date("2013-08-09"), new Date("2013-08-18")]))
      .xAxis();

    // row chart day of week
    dayOfWeekChart.width(300)
      .height(220)
      .margins({ top: 5, left: 10, right: 10, bottom: 20 })
      .dimension(pivot4.dimension)
      .group(pivot4.group())
      .colors(d3.scale.category10())
      .label(function(d) {
        return d.key.split(".")[1];
      })
      .title(function(d) {
        return d.value;
      })
      .elasticX(true)
      .xAxis().ticks(4);

    // islands pie chart
    islandChart.width(250)
      .height(220)
      .radius(100)
      .innerRadius(30)
      .dimension(pivot5.dimension)
      .title(function(d) {
        return d.value;
      })
      .group(pivot5.group());

    // Table of earthquake data
    /*  dataTable.width(960).height(800)
        .dimension(timeDimension)
        .group(function(d) { return "Earthquake Table"
         })
        .size(10)
        .columns([
          function(d) { return d.dtg1; },
          function(d) { return d.lat; },
          function(d) { return d.long; },
          function(d) { return d.depth; },
          function(d) { return d.mag; },
          function(d) { return '<a href=\"http://maps.google.com/maps?z=12&t=m&q=loc:' + d.lat + '+' + d.long +"\" target=\"_blank\">Google Map</a>"},
          function(d) { return '<a href=\"http://www.openstreetmap.org/?mlat=' + d.lat + '&mlon=' + d.long +'&zoom=12'+ "\" target=\"_blank\"> OSM Map</a>"}
        ])
        .sortBy(function(d){ return d.dtg; })
        .order(d3.ascending);*/

  });
};

$(document).ready(function() {
  index();
});
