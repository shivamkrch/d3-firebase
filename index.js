window.onload = e => {
  const data = [
    {
      width: 200,
      height: 100,
      fill: "purple"
    },
    {
      width: 100,
      height: 60,
      fill: "pink"
    },
    {
      width: 50,
      height: 30,
      fill: "red"
    }
  ];
  const canvas = d3.select(".canvas");
  const svg = d3.select("svg");
  const rects = svg.selectAll("rect").data(data);

  rects
    .attr("height", d => d.height)
    .attr("width", d => d.width)
    .attr("fill", d => d.fill);

  rects
    .enter()
    .append("rect")
    .attr("height", d => d.height)
    .attr("width", d => d.width)
    .attr("fill", d => d.fill);

  // Planets
  const planets = d3.select("svg#planets");

  d3.json("planets.json").then(data => {
    const circles = planets.selectAll("circle").data(data);

    circles
      .attr("cy", 100)
      .attr("cx", d => d.distance)
      .attr("r", d => d.radius)
      .attr("fill", d => d.fill);

    circles
      .enter()
      .append("circle")
      .attr("cy", 100)
      .attr("cx", d => d.distance)
      .attr("r", d => d.radius)
      .attr("fill", d => d.fill);
  });

  // Linear Scale in Bar Charts
  // Creating Bar Charts (using JS only)
  const barChart = canvas
    .append("svg")
    .attr("id", "barChart")
    .attr("width", 600)
    .attr("height", 600);

  const margin = { top: 20, right: 20, bottom: 100, left: 100 };
  const graphWidth = 600 - margin.left - margin.right;
  const graphHeight = 600 - margin.top - margin.bottom;

  const graph = barChart
    .append("g")
    .attr("width", graphWidth)
    .attr("height", graphHeight)
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const xAxisGroup = graph
    .append("g")
    .attr("transform", `translate(0,${graphHeight})`);
  const yAxisGroup = graph.append("g");

  // Scales
  const y = d3.scaleLinear().range([graphHeight, 0]);

  const x = d3
    .scaleBand()
    .range([0, 500])
    .paddingInner(0.2)
    .paddingOuter(0.2);

  // Create the axes
  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y).ticks(10);
  //   .tickFormat(d => `${d} orders`);

  const t = d3.transition().duration(500);

  // Update function: Fired on change in data in firestore
  const update = data => {
    const min = d3.min(data, d => d.orders);
    const max = d3.max(data, d => d.orders);
    const extent = d3.extent(data, d => d.orders);
    console.log("min:", min);
    console.log("max:", max);
    console.log("extent:", extent);

    // Updating scale domains
    y.domain([0, d3.max(data, d => d.orders) + 200]);
    x.domain(data.map(item => item.name));

    // Join the data to rects
    const rects = graph.selectAll("rect").data(data);

    // Remove exit selection
    rects.exit().remove();

    // Update current shapes in DOMs
    rects
      .attr("width", x.bandwidth)
      .attr("fill", "orange")
      .attr("x", d => x(d.name));
    // .transition(t)
    // .attr("height", d => graphHeight - y(d.orders))
    // .attr("y", d => y(d.orders));

    // Update the enter selection to the DOM
    rects
      .enter()
      .append("rect")
      .attr("width", x.bandwidth)
      .attr("fill", "orange")
      .attr("x", d => x(d.name))
      .attr("height", 0)
      .attr("y", graphHeight)
      .merge(rects)
      .transition(t)
      // .attrTween("width", widthTween)
      .attr("height", d => graphHeight - y(d.orders))
      .attr("y", d => y(d.orders));

    // call axes
    xAxisGroup.call(xAxis);
    yAxisGroup.call(yAxis);

    // Update axes text
    xAxisGroup
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .attr("text-anchor", "end")
      .attr("fill", "blue")
      .attr("font-size", "12")
      .attr("font-weight", "bold");
    yAxisGroup
      .selectAll("text")
      .attr("fill", "blue")
      .attr("font-size", "12")
      .attr("font-weight", "bold");
  };

  var dishes = [];

  db.collection("dishes").onSnapshot(res => {
    res.docChanges().forEach(change => {
      const doc = { ...change.doc.data(), id: change.doc.id };

      switch (change.type) {
        case "added":
          dishes.push(doc);
          break;
        case "modified":
          const index = dishes.findIndex(item => item.id == doc.id);
          dishes[index] = doc;
          break;
        case "removed":
          dishes = dishes.filter(item => item.id !== doc.id);
          break;
        default:
          break;
      }
    });

    update(dishes);
  });

  const widthTween = d => {
    // define interpolation
    // d3.interpolate returns a function which we call 'i'
    let i = d3.interpolate(0, x.bandwidth());

    // return a function which takes in a time ticker 't'
    return function(t) {
      // return the value from passing the ticker into the interpolation
      return i(t);
    };
  };
};
