// var width = "100%", height = 600;

// var colors = d3.scaleSequential(d3.interpolateRdBu).domain([-1.0, 1.0]);
// interpolateRdYlBu
// https://stackoverflow.com/questions/22893789/d3-color-scale-linear-with-multiple-colors
// https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Gradients

var range_min = -1.0;
var middle = 0;
var range_max = 1.0;

var count = 0;
var max_time = 2000;
var running = 0;
var slowest_time = 200;
var remove_link = false;
var time_interval = slowest_time - Number($("#speed").val()),
  post = 0.4;

var tolerance, learning, rewire;
get_parameters();

var n = 100, // number of nodes
  m = 400; // number of links

const graph = new Graph();
const d3Simulation = new D3Simulation();
graph.use(d3Simulation);

$("#speed").on("change", update_speed);
$("#soflow-t").on("change", update_para);
$("#soflow-i").on("change", update_para);
$("#soflow-u").on("change", update_para);

$(document).ready(start_all);

$("#start-button").click(start_all);
$("#stop-button").click(stop_all);
$("#reset-button").click(reset_all);
$("#default-button").click(default_para);

var timeout;

var demoChat = {
  log(msg) {
    $("#demo-chatting").append(msg + "<br/>");
  },
  clear() {
    $("#demo-chatting").html("");
  },
  show() {
    // Prior to getting your chatting.
    var chatting = document.getElementById("demo-chatting");
    var shouldScroll =
      chatting.scrollTop + chatting.clientHeight === chatting.scrollHeight;
    // After getting your chatting.
    if (!shouldScroll) {
      chatting.scrollTop = chatting.scrollHeight;
    }
  },
};

function update_speed() {
  p = Number($(this).val());
  // clearInterval(interval);
  time_interval = slowest_time - p;
  // interval = setInterval(() => {
  //   graph.runStep();
  //   demoChat.show();
  // }, time_interval);
}

function get_parameters() {
  tolerance = Number($("#soflow-t").val());
  learning = Number($("#soflow-i").val());
  rewire = Number($("#soflow-u").val());
}

function update_para() {
  p = Number($(this).val());
  name = $(this).attr("id");
  if (name == "soflow-t") {
    tolerance = p;
  } else if (name == "soflow-i") {
    learning = p;
  } else {
    rewire = p;
  }
}

function default_para() {
  // for jQuery-1.7.1
  // $('#soflow-t option[value="0.4"]').attr('selected', 'selected');
  $("#soflow-t").val(0.4);
  tolerance = 0.4;
  $("#soflow-i").val(0.8);
  learning = 0.8;
  $("#soflow-u").val(0.9);
  rewire = 0.9;
}

function runStep() {
  if (running === 1) {
    timeout = setTimeout(() => {
      graph.runStep();
      demoChat.show();
      runStep();
    }, time_interval);
  }
}

function start_all() {
  running = 1;
  runStep();
  // $("#start-text").fadeOut();
}

function stop_all() {
  running = 0;
  // $("#start-text").fadeIn();
}

function reset_all() {
  stop_all();
  graph.reset();
  demoChat.clear();
  // $("#start-text").fadeIn();
}

// Infor function
function closeInfoArea() {
  $("#info").css("right", "0px").animate({ right: "-100%" }, 800);
  $("nav").show();
}

function showInfoArea() {
  $("#info").css("right", "-100%").animate({ right: "0px" }, 800);
  $("nav").hide();
}

$("#info-tab").on("click", showInfoArea);
$("#info-close").on("click", closeInfoArea);
