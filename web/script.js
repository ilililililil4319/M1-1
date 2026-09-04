// ===== 상태 =====
let allRows = [];       // data.json 전체 데이터
let meta = {};
let priceChart, volChart;

const els = {
  metaInfo: document.getElementById("metaInfo"),
  presetButtons: document.getElementById("presetButtons"),
  startDate: document.getElementById("startDate"),
  endDate: document.getElementById("endDate"),
  rangeError: document.getElementById("rangeError"),
  statStart: document.getElementById("statStart"),
  statEnd: document.getElementById("statEnd"),
  statMax: document.getElementById("statMax"),
  statMin: document.getElementById("statMin"),
  statChange: document.getElementById("statChange"),
  statCount: document.getElementById("statCount"),
  aiButton: document.getElementById("aiButton"),
  aiOutput: document.getElementById("aiOutput"),
};

// ===== 데이터 로드 =====
async function loadData() {
  try {
    const res = await fetch("data.json");
    if (!res.ok) throw new Error("data.json 응답 실패: " + res.status);
    const json = await res.json();
    allRows = json.data;
    meta = json.meta;

    els.metaInfo.textContent =
      `${meta.source} · ${meta.period_start} ~ ${meta.period_end} · ${meta.count}건`;

    const minDate = allRows[0].date;
    const maxDate = allRows[allRows.length - 1].date;
    els.startDate.min = minDate;
    els.startDate.max = maxDate;
    els.endDate.min = minDate;
    els.endDate.max = maxDate;
    els.startDate.value = minDate;
    els.endDate.value = maxDate;

    initCharts();
    applyRange(minDate, maxDate);
  } catch (err) {
    // 실패 처리: 데이터 로드 자체가 안 되는 경우
    els.metaInfo.textContent = "데이터를 불러오지 못했습니다.";
    showRangeError("data.json을 불러오는 데 실패했습니다. 파일이 web 폴더에 있는지 확인해주세요. (" + err.message + ")");
  }
}

// ===== 차트 초기화 =====
function initCharts() {
  const priceCtx = document.getElementById("priceChart").getContext("2d");
  priceChart = new Chart(priceCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "종가", data: [], borderColor: "#E8ECF3", borderWidth: 1.5, pointRadius: 0, tension: 0.15 },
        { label: "20일 이동평균", data: [], borderColor: "#F2B84B", borderWidth: 1.5, pointRadius: 0, tension: 0.15 },
        { label: "60일 이동평균", data: [], borderColor: "#4C8DFF", borderWidth: 1.5, pointRadius: 0, tension: 0.15 },
      ],
    },
    options: chartOptions(),
  });

  const volCtx = document.getElementById("volChart").getContext("2d");
  volChart = new Chart(volCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "20일 변동성", data: [], borderColor: "#F2B84B", backgroundColor: "rgba(242,184,75,0.12)", fill: true, borderWidth: 1.5, pointRadius: 0, tension: 0.15 },
      ],
    },
    options: chartOptions(),
  });
}

function chartOptions() {
  return {
    responsive: true,
    animation: { duration: 250 },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#121B2E",
        borderColor: "#223047",
        borderWidth: 1,
        titleColor: "#E8ECF3",
        bodyColor: "#E8ECF3",
      },
    },
    scales: {
      x: {
        ticks: { color: "#7E8CA3", maxTicksLimit: 10, font: { family: "JetBrains Mono", size: 10 } },
        grid: { color: "#1A2540" },
      },
      y: {
        ticks: { color: "#7E8CA3", font: { family: "JetBrains Mono", size: 10 } },
        grid: { color: "#1A2540" },
      },
    },
  };
}

// ===== 기간 필터 적용 =====
function applyRange(start, end) {
  hideRangeError();

  if (!start || !end) {
    showRangeError("시작일과 종료일을 모두 선택해주세요.");
    return;
  }
  if (start > end) {
    showRangeError("시작일이 종료일보다 늦을 수 없습니다.");
    return;
  }

  const rows = allRows.filter((r) => r.date >= start && r.date <= end);

  if (rows.length === 0) {
    showRangeError("선택하신 기간에 데이터가 없습니다. 다른 기간을 선택해주세요.");
    updateStats([]);
    return;
  }

  const labels = rows.map((r) => r.date);
  priceChart.data.labels = labels;
  priceChart.data.datasets[0].data = rows.map((r) => r.usd_krw);
  priceChart.data.datasets[1].data = rows.map((r) => r.ma20);
  priceChart.data.datasets[2].data = rows.map((r) => r.ma60);
  priceChart.update();

  volChart.data.labels = labels;
  volChart.data.datasets[0].data = rows.map((r) => r.volatility_20);
  volChart.update();

  updateStats(rows);
}

function showRangeError(msg) {
  els.rangeError.textContent = msg;
  els.rangeError.hidden = false;
}
function hideRangeError() {
  els.rangeError.hidden = true;
}

// ===== 통계 요약 =====
function updateStats(rows) {
  if (rows.length === 0) {
    ["statStart", "statEnd", "statMax", "statMin", "statChange", "statCount"].forEach(
      (id) => (els[id].textContent = "–")
    );
    return;
  }

  // null(이동평균 초반 구간 등 값이 없는 지점)을 제외하고 계산 - 안 그러면 min이 0으로 잘못 나옴
  const values = rows.map((r) => r.usd_krw).filter((v) => v !== null);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const first = rows[0].usd_krw;
  const last = rows[rows.length - 1].usd_krw;
  const changePct = (((last - first) / first) * 100).toFixed(2);

  els.statStart.textContent = `${rows[0].date} (${first.toFixed(1)}원)`;
  els.statEnd.textContent = `${rows[rows.length - 1].date} (${last.toFixed(1)}원)`;
  els.statMax.textContent = max.toFixed(1) + "원";
  els.statMin.textContent = min.toFixed(1) + "원";
  els.statCount.textContent = rows.length + "건";

  els.statChange.textContent = (changePct >= 0 ? "+" : "") + changePct + "%";
  els.statChange.className =
    "ticker-cell__value " + (changePct >= 0 ? "is-rise" : "is-fall");
}

// ===== 프리셋 버튼 =====
els.presetButtons.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-range]");
  if (!btn || allRows.length === 0) return;

  [...els.presetButtons.children].forEach((b) => b.classList.remove("is-active"));
  btn.classList.add("is-active");

  const maxDate = allRows[allRows.length - 1].date;
  let start;

  if (btn.dataset.range === "all") {
    start = allRows[0].date;
  } else {
    const days = parseInt(btn.dataset.range, 10);
    const d = new Date(maxDate);
    d.setDate(d.getDate() - days);
    start = d.toISOString().slice(0, 10);
    if (start < allRows[0].date) start = allRows[0].date;
  }

  els.startDate.value = start;
  els.endDate.value = maxDate;
  applyRange(start, maxDate);
});

// ===== 날짜 직접 선택 =====
[els.startDate, els.endDate].forEach((input) => {
  input.addEventListener("change", () => {
    [...els.presetButtons.children].forEach((b) => b.classList.remove("is-active"));
    applyRange(els.startDate.value, els.endDate.value);
  });
});

// ===== AI 해설 =====
els.aiButton.addEventListener("click", async () => {
  const start = els.startDate.value;
  const end = els.endDate.value;
  const rows = allRows.filter((r) => r.date >= start && r.date <= end);

  if (rows.length === 0) {
    setAiOutput("error", "선택된 기간에 데이터가 없어 해설을 생성할 수 없습니다.");
    return;
  }

  els.aiButton.disabled = true;
  setAiOutput("loading", "AI가 해당 구간을 분석하고 있습니다…");

  const values = rows.map((r) => r.usd_krw).filter((v) => v !== null);
  const first = rows[0].usd_krw;
  const last = rows[rows.length - 1].usd_krw;
  const changePct = (((last - first) / first) * 100).toFixed(2);
  const max = Math.max(...values);
  const min = Math.min(...values);

  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start, end,
        first, last, changePct, max, min,
        count: rows.length,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `서버 오류 (${res.status})`);
    }

    const data = await res.json();
    setAiOutput("done", data.explanation);
  } catch (err) {
    // 실패 처리: API 호출 실패 시 안내
    setAiOutput("error", "AI 해설을 불러오지 못했습니다. 잠시 후 다시 시도해주세요. (" + err.message + ")");
  } finally {
    els.aiButton.disabled = false;
  }
});

function setAiOutput(state, text) {
  els.aiOutput.textContent = text;
  els.aiOutput.className = "ai-output ai-output--" + state;
}

loadData();
