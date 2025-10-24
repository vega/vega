// Import Vega from the built bundle in the repo
// Adjust the path based on where you serve from
const vegaPath = "/packages/vega/build/vega.js";

// Check OffscreenCanvas support
const compatDiv = document.getElementById("compatibility");
if (typeof OffscreenCanvas === "undefined") {
  compatDiv.innerHTML =
    '<strong style="color: red;">❌ OffscreenCanvas not supported in this browser</strong>';
  document.getElementById("status").className = "error";
  document.getElementById("status").textContent =
    "❌ OffscreenCanvas not available (try Chrome 69+, Firefox 105+, or Edge 79+)";
} else {
  compatDiv.innerHTML =
    '<strong style="color: green;">✓ OffscreenCanvas is supported</strong>';

  // Start the test
  runTest();
}

async function runTest() {
  try {
    // Import Vega dynamically
    const vega = await import(vegaPath);

    // Generate 52 weeks of temporal data with varying counts
    const generateWeeklyData = () => {
      const data = [];
      const startDate = new Date(2024, 0, 1); // Jan 1, 2024

      for (let week = 0; week < 52; week++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + week * 7);

        // Generate semi-random count with some pattern
        const baseCount = 50;
        const seasonal = Math.sin(week / 8) * 20; // Seasonal variation
        const noise = Math.random() * 10; // Random noise
        const count = Math.round(baseCount + seasonal + noise);

        data.push({
          week: week + 1,
          date: date.toISOString().split("T")[0],
          count: count,
        });
      }
      return data;
    };

    // Line chart with labels showing weekly counts over a year
    const spec = {
      $schema: "https://vega.github.io/schema/vega/v5.json",
      width: 700,
      height: 400,
      padding: 5,
      autosize: "pad",

      data: [
        {
          name: "table",
          values: generateWeeklyData(),
        },
      ],

      scales: [
        {
          name: "xscale",
          type: "linear",
          domain: { data: "table", field: "week" },
          range: "width",
          nice: false,
        },
        {
          name: "yscale",
          type: "linear",
          domain: { data: "table", field: "count" },
          range: "height",
          nice: true,
          zero: true,
        },
      ],

      axes: [
        {
          orient: "bottom",
          scale: "xscale",
          title: "Week of Year",
          tickCount: 12,
        },
        {
          orient: "left",
          scale: "yscale",
          title: "Count",
        },
      ],

      marks: [
        {
          name: "trend",
          type: "line",
          from: { data: "table" },
          encode: {
            enter: {
              x: { scale: "xscale", field: "week" },
              y: { scale: "yscale", field: "count" },
              stroke: { value: "steelblue" },
              strokeWidth: { value: 2 },
            },
          },
        },
        {
          name: "points",
          type: "symbol",
          from: { data: "table" },
          encode: {
            enter: {
              x: { scale: "xscale", field: "week" },
              y: { scale: "yscale", field: "count" },
              size: { value: 50 },
              fill: { value: "steelblue" },
              stroke: { value: "white" },
              strokeWidth: { value: 1 },
            },
          },
        },
        {
          type: "text",
          from: { data: "points" },
          encode: {
            enter: {
              text: { field: "datum.count" },
              fontSize: { value: 9 },
              fill: { value: "#333" },
            }
          },
          transform: [
            {
              type: "label",
              size: [700, 400],
              padding: 2,
              anchor: ["top", "bottom", "left", "right"],
              offset: [1],
              avoidMarks: ["trend"]
            },
          ],
        },
      ],
    };

    const canvas = document.getElementById("myCanvas");
    const offscreen = canvas.transferControlToOffscreen();
    const worker = new Worker("worker.js", { type: "module" });

    document.getElementById("status").textContent =
      "Worker created, sending canvas and spec...";

    // Send canvas and spec to worker
    worker.postMessage(
      {
        canvas: offscreen,
        spec: spec,
        vegaPath: vegaPath,
      },
      [offscreen],
    );

    // Listen for messages from worker
    worker.addEventListener("message", (event) => {
      console.log("Main received message:", event.data);
      const statusEl = document.getElementById("status");

      if (event.data.type === "progress") {
        statusEl.className = "loading";
        statusEl.textContent = event.data.message;
      } else if (event.data.type === "success") {
        statusEl.className = "success";
        statusEl.textContent = "✓ " + event.data.message;
      } else if (event.data.type === "error") {
        statusEl.className = "error";
        statusEl.textContent = "❌ " + event.data.message;
        console.error("Worker error:", event.data.error);
      }
    });

    worker.addEventListener("error", (error) => {
      const statusEl = document.getElementById("status");
      statusEl.className = "error";
      statusEl.textContent = "❌ Worker error: " + error.message;
      console.error("Worker error:", error);
    });
  } catch (error) {
    document.getElementById("status").className = "error";
    document.getElementById("status").textContent =
      "❌ Failed to load Vega: " + error.message;
    console.error("Error:", error);
  }
}
