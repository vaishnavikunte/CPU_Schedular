document.addEventListener("DOMContentLoaded", () => {
    // --- UI Elements ---
    const landingScreen = document.getElementById("landing-screen");
    const selectionScreen = document.getElementById("selection-screen");
    const algoSelectionScreen = document.getElementById("algo-selection-screen");
    const inputScreen = document.getElementById("input-screen");
    const algoCardsContainer = document.getElementById("algo-cards-container");
    const algoTypeTitle = document.getElementById("algo-type-title");
    const algoNameTitle = document.getElementById("selected-algo-name");
    const processCountInput = document.getElementById("process-count");
    const tableContainer = document.getElementById("process-table-container");
    const quantumWrapper = document.getElementById("quantum-wrapper");
    const resultsArea = document.getElementById("results-area");
    const ganttChart = document.getElementById("gantt-chart");
    const outputTableContainer = document.getElementById(
      "output-table-container",
    );
    const avgWtLabel = document.getElementById("avg-wt");
    const avgTatLabel = document.getElementById("avg-tat");
    const algoResultBadge = document.getElementById("algo-result-badge");
  
    let currentAlgorithm = "";
  
    document
      .getElementById("start-btn")
      .addEventListener("click", () =>
        switchScreen(landingScreen, selectionScreen),
      );
    document
      .getElementById("back-to-landing")
      .addEventListener("click", () =>
        switchScreen(selectionScreen, landingScreen),
      );
    document
      .getElementById("back-to-type")
      .addEventListener("click", () =>
        switchScreen(algoSelectionScreen, selectionScreen),
      );
    document
      .getElementById("back-to-algo")
      .addEventListener("click", () =>
        switchScreen(inputScreen, algoSelectionScreen),
      );
    document
      .getElementById("generate-btn")
      .addEventListener("click", generateTable);
  
    document.getElementById("preemptive-btn").addEventListener("click", () => {
      const algos = [
        { id: "RR", name: "Round Robin", desc: "Time-sliced execution" },
        { id: "SRTF", name: "SRTF", desc: "Shortest Remaining Time First" },
        { id: "PP", name: "Priority Scheduling", desc: "Pre-emptive Priority" },
      ];
      showAlgoOptions("Pre-emptive Algorithms", algos);
    });
  
    document
      .getElementById("non-preemptive-btn")
      .addEventListener("click", () => {
        const algos = [
          { id: "FCFS", name: "FCFS", desc: "First Come First Serve" },
          { id: "SJF", name: "SJF", desc: "Shortest Job First" },
          {
            id: "NPP",
            name: "Priority Scheduling",
            desc: "Non-Preemptive Priority",
          },
        ];
        showAlgoOptions("Non-Preemptive Algorithms", algos);
      });
  
    function switchScreen(hide, show) {
      hide.classList.remove("active");
      hide.classList.add("hidden");
      setTimeout(() => {
        show.classList.remove("hidden");
        show.classList.add("active");
      }, 300);
    }
  
    function showAlgoOptions(title, algos) {
      algoTypeTitle.innerText = title;
      algoCardsContainer.innerHTML = "";
      algos.forEach((algo) => {
        const card = document.createElement("div");
        card.className = "option-card small-card";
        card.innerHTML = `<h3>${algo.name}</h3><p>${algo.desc}</p>`;
        
        card.onclick = () => {
          currentAlgorithm = algo.id;
          goToInputPage(algo.name);
        };
        algoCardsContainer.appendChild(card);
      });
      switchScreen(selectionScreen, algoSelectionScreen);
    }
  
    function goToInputPage(name) {
      algoNameTitle.innerText = name;
      algoResultBadge.innerText = name;
      resultsArea.classList.add("hidden");
      currentAlgorithm === "RR"
        ? quantumWrapper.classList.remove("hidden")
        : quantumWrapper.classList.add("hidden");
      switchScreen(algoSelectionScreen, inputScreen);
      generateTable();
    }
  
    function generateTable() {
      const count = parseInt(processCountInput.value) || 3;

      let isPriority = currentAlgorithm === "PP" || currentAlgorithm === "NPP";
      let html = `<table><thead><tr><th>Process</th><th>Arrival Time</th><th>Burst Time</th>${isPriority ? "<th>Priority</th>" : ""}</tr></thead><tbody>`;
      for (let i = 1; i <= count; i++) {
        html += `<tr><td>P${i}</td>
                  <td><input type="number" class="at-input" value="0" min="0"></td>
                  <td><input type="number" class="bt-input" value="1" min="1"></td>
                  ${isPriority ? '<td><input type="number" class="priority-input" value="1"></td>' : ""}</tr>`;
      }
      tableContainer.innerHTML = html + `</tbody></table>`;
    }
  
    // --- Calculation Engine ---
    document.getElementById("calculate-btn").addEventListener("click", () => {
      const atInputs = document.querySelectorAll(".at-input");
      const btInputs = document.querySelectorAll(".bt-input");
      const prioInputs = document.querySelectorAll(".priority-input");
  
      let processes = Array.from(atInputs).map((at, i) => ({
        id: `P${i + 1}`,
        at: parseInt(at.value) || 0,
        bt: parseInt(btInputs[i].value) || 1,
        remaining: parseInt(btInputs[i].value) || 1,
        prio: prioInputs[i] ? parseInt(prioInputs[i].value) : 0,
        wt: 0,
        tat: 0,
        ct: 0,
        completed: false,
      }));
  
      let currentTime = 0,
        completedCount = 0,
        ganttBlocks = [];
      let lastId = null;
  
      // 1. ROUND ROBIN
      if (currentAlgorithm === "RR") {
        const tq = parseInt(document.getElementById("tq").value) || 2;
        let queue = [],
          visited = new Set();
        let procs = processes.map((p) => ({ ...p }));
  
        while (completedCount < procs.length) {
          procs.forEach((p) => {
            if (p.at <= currentTime && !visited.has(p.id)) {
              queue.push(p);
              visited.add(p.id);
            }
          });
  
          if (queue.length === 0) {
            let nextArrival = Math.min(
              ...procs.filter((p) => !visited.has(p.id)).map((p) => p.at),
            );
            ganttBlocks.push({
              id: "Idle",
              start: currentTime,
              end: nextArrival,
              isIdle: true,
            });
            currentTime = nextArrival;
            continue;
          }
  
          let curr = queue.shift();
          let exec = Math.min(tq, curr.remaining);
          ganttBlocks.push({
            id: curr.id,
            start: currentTime,
            end: currentTime + exec,
            isIdle: false,
          });
          let startWin = currentTime;
          currentTime += exec;
          curr.remaining -= exec;
  
          procs.forEach((p) => {
            if (p.at > startWin && p.at <= currentTime && !visited.has(p.id)) {
              queue.push(p);
              visited.add(p.id);
            }
          });
  
          if (curr.remaining > 0) queue.push(curr);
          else {
            curr.ct = currentTime;
            curr.tat = curr.ct - curr.at;
            curr.wt = curr.tat - curr.bt;
            completedCount++;
            let orig = processes.find((p) => p.id === curr.id);
            Object.assign(orig, curr);
          }
        }
      }
      // 2. PRE-EMPTIVE (SRTF / PP)

      else if (currentAlgorithm === "SRTF" || currentAlgorithm === "PP") {
        let procs = processes.map((p) => ({ ...p }));
        while (completedCount < procs.length) {
          let available = procs.filter(
            (p) => p.at <= currentTime && p.remaining > 0,
          );
          if (available.length === 0) {
            if (lastId !== "Idle")
              ganttBlocks.push({ id: "Idle", start: currentTime, isIdle: true });
            lastId = "Idle";
            currentTime++;
            continue;
          }
  
          if (currentAlgorithm === "SRTF")
            available.sort((a, b) => a.remaining - b.remaining || a.at - b.at);
          else available.sort((a, b) => a.prio - b.prio || a.at - b.at);
  
          let curr = available[0];
          if (curr.id !== lastId) {
            if (ganttBlocks.length > 0)
              ganttBlocks[ganttBlocks.length - 1].end = currentTime;
            ganttBlocks.push({ id: curr.id, start: currentTime, isIdle: false });
            lastId = curr.id;
          }
          curr.remaining--;
          currentTime++;
          if (curr.remaining === 0) {
            curr.ct = currentTime;
            curr.tat = curr.ct - curr.at;
            curr.wt = curr.tat - curr.bt;
            completedCount++;
            ganttBlocks[ganttBlocks.length - 1].end = currentTime;
            lastId = null;
            let orig = processes.find((p) => p.id === curr.id);
            Object.assign(orig, curr);
          }
        }
      }
      // 3. NON-PREEMPTIVE (SJF / FCFS / NPP)
      else {
        let procs = processes.map((p) => ({ ...p }));
        while (completedCount < procs.length) {
          let available = procs.filter(
            (p) => p.at <= currentTime && !p.completed,
          );
  
          if (available.length === 0) {
            let nextArrival = Math.min(
              ...procs.filter((p) => !p.completed).map((p) => p.at),
            );
            ganttBlocks.push({
              id: "Idle",
              start: currentTime,
              end: nextArrival,
              isIdle: true,
            });
            currentTime = nextArrival;
            continue;
          }
  
          if (currentAlgorithm === "SJF")
            available.sort((a, b) => a.bt - b.bt || a.at - b.at);
          else if (currentAlgorithm === "FCFS")
            available.sort((a, b) => a.at - b.at);
          else available.sort((a, b) => a.prio - b.prio || a.at - b.at); // NPP
  
          let curr = available[0];
          let start = currentTime;
          currentTime += curr.bt;
          curr.ct = currentTime;
          curr.tat = curr.ct - curr.at;
          curr.wt = curr.tat - curr.bt;
          curr.completed = true;
          completedCount++;
  
          ganttBlocks.push({
            id: curr.id,
            start,
            end: currentTime,
            isIdle: false,
          });
          let orig = processes.find((p) => p.id === curr.id);
          Object.assign(orig, curr);
        }
      }
  
      // --- Render Results ---
      let ganttHtml = "";
      ganttBlocks.forEach((b) => {
        const dur = b.end - b.start;
        ganttHtml += `<div class="gantt-block ${b.isIdle ? "idle" : ""}" style="min-width:${Math.max(60, dur * 25)}px">
                  <span>${b.id}</span><small>${b.start}–${b.end}</small></div>`;
      });
      ganttChart.innerHTML = ganttHtml;
  
      let tableHtml = `<table><thead><tr><th>Process</th><th>AT</th><th>BT</th><th>TAT</th><th>WT</th></tr></thead><tbody>`;
      let tWt = 0,
        tTat = 0;
      processes.forEach((p) => {
        tWt += p.wt;
        tTat += p.tat;
        tableHtml += `<tr><td>${p.id}</td><td>${p.at}</td><td>${p.bt}</td><td>${p.tat}</td><td>${p.wt}</td></tr>`;
      });
      outputTableContainer.innerHTML = tableHtml + `</tbody></table>`;
      avgWtLabel.innerText = (tWt / processes.length).toFixed(2);
      avgTatLabel.innerText = (tTat / processes.length).toFixed(2);
      resultsArea.classList.remove("hidden");
      resultsArea.scrollIntoView({ behavior: "smooth" });
    });
  });