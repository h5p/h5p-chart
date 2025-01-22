/*global d3*/
H5P.Chart.PieChart = (function () {

  /**
   * Creates a pie chart from the given data set.
   *
   * @class
   * @param {array} params from semantics, contains data set
   * @param {H5P.jQuery} $wrapper
   */
  function PieChart(params, $wrapper) {
    var self = this;
    var dataSet = params.listOfTypes;

    var defColors = d3.scale.ordinal()
      .range(["#90EE90", "#ADD8E6", "#FFB6C1", "#B0C4DE", "#D3D3D3", "#20B2AA", "#FAFAD2"]);

    // Create SVG
    var viewBoxSize = 400;
    var padding = 20;
    var radius = (viewBoxSize / 2) - padding;

    var svg = d3.select($wrapper[0])
      .append("svg")
      .attr("viewBox", "0 0 " + viewBoxSize + " " + viewBoxSize)

    svg.append("desc").html(params.figureDefinition);

    var translater = svg.append("g")
      .attr("class", "translater")
      .attr("transform", "translate(" + viewBoxSize / 2 + "," + viewBoxSize / 2 + ")");

    var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) {
        return d.value;
      });

    var arcs = translater.selectAll(".arc")
      .data(pie(dataSet))
      .enter().append("g")
      .attr("class", "arc");

    var arcGenerator = d3.svg.arc()
      .outerRadius(radius)
      .innerRadius(0);

    arcs.append("path")
      .style("fill", function(d) {
        return d.data.color !== undefined ? d.data.color : defColors(dataSet.indexOf(d.data) % defColors.range().length);
      })
      .attr("d", arcGenerator);

    var texts = arcs.append("svg:text")
      .attr("class", "text")
      .attr("aria-hidden", true)
      .attr("text-anchor", "middle")
      .text(function(d, i) {
        return dataSet[i].text + ': ' + dataSet[i].value;
      })
      .attr("fill", function (d) {
        if (d.data.fontColor !== undefined) {
          return d.data.fontColor;
        }
      })
      .attr("transform", function(d) {
        return "translate(" + arcGenerator.centroid(d) + ")";
      })
      .style("font-size", Math.max(radius * 0.1, 10) + "px");

    /**
     * Fit the current chart to the size of the wrapper.
     */
    self.resize = function () {
      // Scale to smallest value of height and width
      var style = window.getComputedStyle($wrapper[0]);
      var width = parseFloat(style.width);
      var height = parseFloat(style.height);
      var minDimension = Math.min(width, height);
      var scalingFactor = minDimension / viewBoxSize;
      var newRadius = (viewBoxSize / 2) - padding;

      var newFontSize = Math.max(newRadius * 0.1 * scalingFactor, 10);
      texts.style("font-size", newFontSize + "px");
    };

    self.resize();
    window.addEventListener('resize', self.resize);
  }

  return PieChart;
})();
