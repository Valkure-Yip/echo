class Plot {
  constructor() {
    this.timeseries = new Array(n);
    this.plotOptions = {
      xaxis: { min: 0 },
      yaxis: { min: range_min - 0.1, max: range_max + 0.1, tickLength: 0 },
      series: { lines: { lineWidth: 0.8 }, shadowSize: 0 },
      grid: {
        hoverable: false,
        borderWidth: 2,
        backgroundColor: "#fafafa",
      },
    };
    this.plot = $.plot($("#demo-epicurves"), [], this.plotOptions);
    this.nodes = [];
  }
  reset(nodes) {
    this.nodes = nodes;
    for (let i = 0; i < n; i++) {
      this.timeseries[i] = [];
      this.timeseries[i].data = [];
      this.timeseries[i].color = colors(this.nodes[i].opinion);
    }
    this.update_plot(0);
  }
  update_plot(count) {
    for (var i = 0; i < n; i++) {
      this.timeseries[this.nodes[i].name].data.push([
        count,
        this.nodes[i].opinion,
      ]);
    }
    this.plot.setData(this.timeseries);
    this.plot.setupGrid();
    this.plot.draw();
  }
}
