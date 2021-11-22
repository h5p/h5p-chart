/*global d3*/
H5P.Chart.ExtendedBarChart = (function () {

  /**
   * Creates a bar chart from the given data set.
   *
   * Notice: ExtendedBar uses its own listOfTypes in h5p-chart/semantics.json, its differentiated through the use of "showWhen"-widget
   * @class
   * @param {Object} params from semantics, contains data set
   * @param {H5P.jQuery} $wrapper
   */
  function extendedBarChart(params, $wrapper) {
    var self = this;
    var dataSet = params.listOfTypes;
    var defColors = d3.scale.ordinal()
        .range(['#fbb033', '#2f2f2f', '#FFB6C1', '#B0C4DE', '#D3D3D3', '#20B2AA', '#FAFAD2']);

    //Lets check if the axes titles are defined, used for setting correct offset for title space in the generated svg
    var chartTextDefined = !!params.chartText;
    var isXAxisTextDefined = !!params.xAxisText;
    var isYAxisTextDefined = !!params.yAxisText;

    var ariaChartText = chartTextDefined ? params.chartText : "";
    var ariaXaxisText = isXAxisTextDefined ? params.xAxisText : "";
    var ariaYaxisText = isYAxisTextDefined ? params.yAxisText : "";
    // Create scales for bars
    var xScale = d3.scale.ordinal()
        .domain(d3.range(dataSet.length));

    var yScale = d3.scale.linear()
        .domain([0, d3.max(dataSet, function (d) {
          return d.value ;
        })]);
    var x = d3.time.scale();
    var y = d3.scale.linear();

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .tickFormat(function (d) {
          return dataSet[d % dataSet.length].text;
        });

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('left');
    // Create SVG element
    var svg = d3.select($wrapper[0])
        .append('svg');

    svg.append('desc').html('chart');
    svg.attr("aria-label", "Bar chart, title: " + ariaChartText +
        ", X axis title: " + ariaXaxisText + ", Y axis text: " + ariaYaxisText);
    // Create x axis
    var xAxisG = svg.append('g')
        .attr('class', 'x-axis');

    var yAxisG = svg.append('g')
        .attr('class', 'y-axis')

    /**
     * @private
     */
    var key = function (d) {
      return dataSet.indexOf(d);
    };
    //rectGroup is for grouping the bars in
    var rectGroup = svg.append("g")
        .attr("class", "rect-group");

    // Create rectangles for bars
    var rects = rectGroup.selectAll('rect')
        .data(dataSet, key)
        .enter()
        .append('rect')
        .attr("tabindex", 0)
        .attr('focusable', 'true')
        .attr('class', 'bar')
        .attr("aria-label", (data) => "Y axis: " +  ariaYaxisText + ": " + data.value +
            ", X axis: " + ariaXaxisText + ": " + data.text)
        .attr('fill', function(d) {
          if(params.overrideColorGroup && params.overrideColorGroup.overrideChartColorsTick ){
            return params.overrideColorGroup.overrideChartColor;
          }
          if (d.color !== undefined) {
            return d.color;
          }
          return defColors(dataSet.indexOf(d) % 7);
        });

    var chartText = svg.append('text')
        .style('text-anchor', 'middle')
        .attr('class', 'chart-title')
        .text(params.chartText);

    var xAxisTitle = svg.append('text')
        .style('text-anchor', 'middle')
        .attr('class', 'axis-title')
        .text(params.xAxisText);

    var yAxisTitle = svg.append('text')
        .style('transform', 'rotate(90deg)')
        .attr('class', 'axis-title')
        .text(params.yAxisText);

    // Create inner rect labels
    var xAxisGTexts = svg.selectAll('x-axis text')
        .data(dataSet, key)
        .enter();

    // Create inner rect labels
    var barTexts = rectGroup
        .selectAll('text')
        .data(dataSet, key)
        .enter()
        .append('text')
        .attr('text-anchor', 'middless')
        .text(function(d) {
          return d.value;
        })
        .attr('text-anchor', 'middless')
        .attr('fill', function (d) {
          if(params.overrideColorGroup && params.overrideColorGroup.overrideChartColorsTick ){
            return params.overrideColorGroup.overrideChartColorText;
          }
          if (d.fontColor !== undefined) {
            return d.fontColor;
          }
          return '000000';
        })
        .attr('aria-hidden', true);

    /**
     * Fit the current bar chart to the size of the wrapper.
     */
    self.resize = function () {
      // Always scale to available space
      var style = window.getComputedStyle($wrapper[0]);
      var horizontalPadding = Math.max(parseFloat(style.width) / 12, 40);
      var verticalPadding = Math.max(parseFloat(style.height) / 12, 20);
      var width = parseFloat(style.width) - horizontalPadding;
      var h = parseFloat(style.height) - verticalPadding;
      var fontSize = parseFloat(style.fontSize);
      var lineHeight = (1.25 * fontSize);
      var xTickSize = (fontSize * 0.125);
      var xAxisRectOffset = lineHeight * 3;
      //If chart title doesnt exist, we still make an offset
      var chartTitleTextHeight = chartTextDefined ? svg.select('.chart-title')[0][0].getBoundingClientRect().height : 20;
      var chartTitleTextOffset =  chartTitleTextHeight  + lineHeight + verticalPadding; // Takes the height of the text element and adds line height, so we always have som space under the title
      var height = h - xTickSize - (lineHeight * 2) - chartTitleTextOffset; // Add space for labels below, and also the chart title
      //if xAxisTitle exists, them make room for it by adding more lineheight
      if(isXAxisTextDefined) {
        height = h - xTickSize - (lineHeight * 4) - chartTitleTextOffset;
      }
      // Update SVG size
      svg.attr('viewBox', `0 0 ${width + horizontalPadding} ${h + verticalPadding}`);

      // Update scales
      xScale.rangeRoundBands([0, width - xAxisRectOffset], 0.05); //In order for the X scale to NOT overlap Y axis ticks, we define and offset, making the X scale start further away from the svg wrapper edge
      yScale.range([height, 0]); //Unlike in 'bar.js', we have 'flipped' the chart, making origo to be in top left corner of chart. This is due to the nature of the Y axis ticks

      x.range([0, width]);
      y.range([height, 0]);

      xAxis.tickSize([0]);
      xAxisG.call(xAxis);

      yAxisG.call(yAxis
          .tickSize(-width, 0, 0)
          .ticks(getSmartTicks(d3.max(dataSet).value).count));
      //Gets first text element from the Y Axis
      var yAxisTicksText = yAxisG.selectAll('g.tick text')[0];
      //Gets width of last Y Axis tick text elements
      var yAxisLastTickWidth = yAxisTicksText[yAxisTicksText.length-1].getBoundingClientRect().width;

      var minYAxisGMargin = 20;
      var yAxisTitleWidth = yAxisTitle[0][0].getBoundingClientRect().width;
      //x translateion differs from when the y axis title text is defined
      const xTranslation = (isYAxisTextDefined ? yAxisLastTickWidth + yAxisTitleWidth + minYAxisGMargin : yAxisLastTickWidth);

      // Y translation used for y axis tick group
      const yTranslation = chartTitleTextOffset;

      xAxisG.attr('transform', `translate(${xTranslation + minYAxisGMargin + xScale.rangeBand()/2}, ${lineHeight/2})`);
      yAxisG
          .attr('transform', `translate(${xTranslation + lineHeight}, ${yTranslation})`);
      //Sets the axes titles on resize
      chartText
          .attr('x', width/2 )
          .attr('y', lineHeight);

      xAxisTitle
          .attr('x', width/2 )
          .attr('y', h-2);
      yAxisTitle
          .attr('x', height/2)
          .attr('y', 0);
      var xAxisGTexts = svg.selectAll('g.x-axis g.tick');

      xAxisGTexts.attr('transform', function(d, i) {
        var x = xScale(i);
        var y = chartTitleTextOffset + height;
        return  `translate (${x}, ${y})`;

      });
//positioning the rectgroup
      rectGroup.attr('transform', `translate(${xTranslation + lineHeight}, ${chartTitleTextOffset})`);

      //rects are already inside the rectGroup, so we need to position them
      rects.attr('x', function(d, i) {
        return xScale(i);
      }).attr('y', function(d) {
        return  yScale(d.value);
      }).attr('width', xScale.rangeBand())
          .attr('height', function(d) {
            return height - yScale(d.value) ;
          });

      var offsetFromBar = 5;
      // Re-locate text value labels

      barTexts.attr('x', function(d, i) {
          var barTextWidth = this.getBoundingClientRect().width;
          return xScale(i) + xScale.rangeBand() / 2 - barTextWidth / 2;

      }).attr('y', function(d) {
        return yScale(d.value)  - offsetFromBar;
      });


      // Hide ticks from screen readers, the entire rectangle is already labelled
      xAxisG.selectAll('text').attr('aria-hidden', true);
    };
  }

  /**
   * Calculates number of ticks based on an array of numbers
   * @param val
   * @returns {{endPoint: number, count: number}}
   */
  function getSmartTicks(val) {

    //base step between nearby two ticks
    var step = Math.pow(10, val.toString().length - 1);

    //modify steps either: 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000...
    if (val / step < 2) {
      step = step / 5;
    } else if (val / step < 5) {
      step = step / 2;
    }

    //add one more step if the last tick value is the same as the max value
    //if you don't want to add, remove '+1'
    var slicesCount = Math.ceil((val + 1) / step);

    return {
      endPoint: slicesCount * step,
      count: Math.min(10, slicesCount) //show max 10 ticks
    };

  }

  return extendedBarChart;
})();
