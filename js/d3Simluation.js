var range_min = -1.0;
var middle = 0;
var range_max = 1.0;

var colors = d3
  .scaleLinear()
  .domain([range_min, middle, range_max])
  .range(["red", "purple", "blue"]);

class D3Simulation {
  constructor() {
    this.nodes = [];
    this.links = [];
    this.width = document.getElementById("demo-graph-layout").offsetWidth;
    this.height =
      document.getElementById("demo-graph-layout").offsetHeight -
      document.getElementById("speed-box").offsetHeight;
    // this.colors = d3
    //   .scaleLinear()
    //   .domain([range_min, middle, range_max])
    //   .range(["red", "purple", "blue"]);
    this.svg = d3
      .select("#demo-graph-layout")
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);
    this.simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3
          .forceLink()
          .id((d) => {
            return d.index;
          })
          .distance(10)
          .strength(0.1)
      )
      .force("charge", d3.forceManyBody().strength(-50))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2));
    this.svgNodes;
    this.svgLinks;
  }

  update_network(t_node, t_link, action) {
    this.simulation.force("link").links(this.links);
    // safari doesn't allow assigning parameter default value.
    this.svg.selectAll("line.link, circle.node").remove();
    //SVG doesn't have a convenient equivalent to html's `z-index`; instead, it relied on the order of the elements in the markup. Below, we add the nodes after the links to ensure that nodes apprear on top of links.

    this.svgLinks = this.svg
      .selectAll("line.link")
      .data(this.links, function (d) {
        return d.index;
      })
      .enter()
      .append("line")
      .attr("class", "link");

    this.svgNodes = this.svg
      .selectAll("circle.node")
      .data(this.nodes, function (d) {
        return d.index;
      })
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("r", function (d) {
        return 2 * Math.sqrt(d.k) + 2;
      })
      .style("fill", function (d) {
        return colors(d.opinion);
      })
      // .on("mouseover", function(d) {
      //     $("#opinion").html(roundToTwo(d.opinion));
      //     $("#agent").html(d.name);
      //   })
      .call(
        d3
          .drag()
          .on("start", this.dragstarted.bind(this))
          .on("drag", this.dragged.bind(this))
          .on("end", this.dragended.bind(this))
      );

    if (t_node) {
      this.svgNodes._groups[0][t_node.index].style.fill = "black";
    }
    if (t_link) {
      // highlight the removed link and new link.
      if (action === "DEL_LINK") {
        this.svgLinks._groups[0][t_link.index].style.strokeDasharray = "5, 5";
        this.svgLinks._groups[0][t_link.index].style.strokeOpacity = 1;
        this.svgLinks._groups[0][t_link.index].style.strokeWidth = 2;
      } else if (action === "ADD_LINK") {
        this.svgLinks._groups[0][t_link.index].style.strokeOpacity = 1;
        this.svgLinks._groups[0][t_link.index].style.strokeWidth = 2;
      }
    }
    this.simulation.alpha(0.1);
    this.simulation.restart();
  }

  update_strength(avg_deviation) {
    this.simulation.force(
      "charge",
      d3.forceManyBody().strength(-1 - avg_deviation * 90)
    );
  }

  reset(nodes, links) {
    this.nodes = nodes;
    this.links = links;
    this.simulation.nodes(this.nodes).on("tick", this.ticked.bind(this));
    this.update_network();
    // .force("y", d3.forceY(width))
    // .force("x", d3.forceX(height));

    // this.simulation.nodes(this.nodes).on("tick", this.ticked.bind(this));
    // this.simulation.force("link").links(this.links);
  }

  dragstarted(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0.2).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  dragended(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  ticked() {
    this.svgNodes
      .attr("cx", function (d) {
        var radius = 2 * Math.sqrt(d.k);
        var max = this.width - this.radius;
        if (d.x < radius) {
          return (d.x = radius + 1);
        } else if (d.x > max) {
          return (d.x = max - 1);
        } else {
          return (d.x = d.x);
        }
      })
      .attr("cy", function (d) {
        var radius = 2 * Math.sqrt(d.k);
        var max = this.height - this.radius;
        if (d.y < radius) {
          return (d.y = radius + 1);
        } else if (d.y > max) {
          return (d.y = max - 1);
        } else {
          return (d.y = d.y);
        }
      });
    this.svgLinks
      .attr("x1", function (d) {
        return d.source.x;
      })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });
  }
}
