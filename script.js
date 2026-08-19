// ===== Fade-in on scroll =====
const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });
fadeEls.forEach(el => observer.observe(el));

// ===== Smooth scroll button =====
document.getElementById('scrollToCalc').addEventListener('click', () => {
  document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
});

// ===== Category labels =====
const CATEGORY_LABELS = {
  travel: 'ท่องเที่ยว',
  gadget: 'ของใช้ / อุปกรณ์',
  emergency: 'เงินสำรองฉุกเฉิน',
  education: 'การศึกษา',
  other: 'อื่น ๆ'
};

// ===== Elements =====
const incomeInput = document.getElementById('income');
const goalInput = document.getElementById('goal');
const monthsInput = document.getElementById('months');
const categorySelect = document.getElementById('category');
const formError = document.getElementById('formError');

const resultCard = document.getElementById('resultCard');
const gaugeFill = document.getElementById('gaugeFill');
const gaugePercent = document.getElementById('gaugePercent');
const resultStatus = document.getElementById('resultStatus');
const resultDetail = document.getElementById('resultDetail');

const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 85; // r=85

let lastResult = null; // holds the most recent calculation, ready to be saved

// ===== Calculation =====
function calculate() {
  formError.textContent = '';

  // ต้องแปลงค่าจาก input (string) เป็นตัวเลขก่อนคำนวณเสมอ
  const income = parseFloat(incomeInput.value);
  const goal = parseFloat(goalInput.value);
  const months = parseFloat(monthsInput.value);

  if (isNaN(income) || isNaN(goal) || isNaN(months) || income <= 0 || goal <= 0 || months <= 0) {
    formError.textContent = 'กรุณากรอกตัวเลขให้ครบและมากกว่า 0 ทุกช่อง';
    return;
  }

  const monthlySaving = goal / months;
  const dailySaving = monthlySaving / 30;
  const percentOfIncome = (monthlySaving / income) * 100;
  const clampedPercent = Math.min(percentOfIncome, 100);

  // ใช้ if/else จำแนกระดับความยากของเป้าหมาย
  let level, label, detail;
  if (percentOfIncome <= 15) {
    level = 'easy';
    label = 'เป้าหมายนี้ทำได้สบาย ๆ';
    detail = `คุณต้องออมเดือนละ ${monthlySaving.toFixed(0)} บาท (ราว ${dailySaving.toFixed(0)} บาท/วัน) — คิดเป็นเพียง ${percentOfIncome.toFixed(1)}% ของรายได้`;
  } else if (percentOfIncome <= 35) {
    level = 'medium';
    label = 'ท้าทายพอสมควร แต่เป็นไปได้';
    detail = `คุณต้องออมเดือนละ ${monthlySaving.toFixed(0)} บาท (ราว ${dailySaving.toFixed(0)} บาท/วัน) คิดเป็น ${percentOfIncome.toFixed(1)}% ของรายได้ ลองวางแผนลดรายจ่ายที่ไม่จำเป็นดูนะ`;
  } else {
    level = 'hard';
    label = 'เป้าหมายนี้ค่อนข้างหนัก!';
    detail = `คุณต้องออมเดือนละ ${monthlySaving.toFixed(0)} บาท (ราว ${dailySaving.toFixed(0)} บาท/วัน) ซึ่งสูงถึง ${percentOfIncome.toFixed(1)}% ของรายได้ ลองขยายระยะเวลาหรือปรับลดเป้าหมายดูก่อน`;
  }

  // อัปเดต gauge
  const offset = GAUGE_CIRCUMFERENCE - (clampedPercent / 100) * GAUGE_CIRCUMFERENCE;
  gaugeFill.style.strokeDashoffset = offset;
  gaugePercent.textContent = `${percentOfIncome.toFixed(0)}%`;

  resultCard.classList.remove('state-easy', 'state-medium', 'state-hard');
  resultCard.classList.add(`state-${level}`);

  resultStatus.textContent = label;
  resultDetail.textContent = detail;

  lastResult = {
    income, goal, months,
    category: categorySelect.value,
    monthlySaving: Math.round(monthlySaving),
    dailySaving: Math.round(dailySaving),
    percentOfIncome: Math.round(percentOfIncome * 10) / 10,
    level,
    savedAt: new Date().toISOString()
  };
}

document.getElementById('calcBtn').addEventListener('click', calculate);

// ===== Local Storage: Save / Load / Clear =====
const STORAGE_KEY = 'neurasave_goals';

function loadGoals() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function persistGoals(goals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

function renderHistory() {
  const goals = loadGoals();
  const listEl = document.getElementById('historyList');

  if (goals.length === 0) {
    listEl.innerHTML = '<p class="empty-state">ยังไม่มีข้อมูลที่บันทึกไว้ — ลองคำนวณและกด "บันทึกผลลัพธ์" ดูสิ</p>';
    return;
  }

  const colorMap = { easy: 'var(--cyan)', medium: 'var(--purple)', hard: 'var(--pink-warn)' };
  const labelMap = { easy: 'ง่าย', medium: 'ปานกลาง', hard: 'ยาก' };

  listEl.innerHTML = goals
    .slice()
    .reverse()
    .map(g => {
      const date = new Date(g.savedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
      return `
        <div class="history-item">
          <div>
            <div><strong>${CATEGORY_LABELS[g.category] || g.category}</strong> — เป้าหมาย ${g.goal.toLocaleString()} บาท ใน ${g.months} เดือน</div>
            <div class="history-meta">ออมวันละ ${g.dailySaving.toLocaleString()} บาท • ${g.percentOfIncome}% ของรายได้ • ${date}</div>
          </div>
          <span class="tag" style="color:${colorMap[g.level]}">${labelMap[g.level]}</span>
        </div>
      `;
    })
    .join('');
}

document.getElementById('saveBtn').addEventListener('click', () => {
  if (!lastResult) {
    formError.textContent = 'กรุณากด "คำนวณ" ก่อนบันทึกผลลัพธ์';
    return;
  }
  const goals = loadGoals();
  goals.push(lastResult);
  persistGoals(goals);
  renderHistory();
});

document.getElementById('clearBtn').addEventListener('click', () => {
  if (confirm('ต้องการล้างข้อมูลที่บันทึกไว้ทั้งหมดหรือไม่?')) {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  }
});

// โหลดข้อมูลที่เคยบันทึกไว้ทันทีที่เปิดหน้า
renderHistory();
