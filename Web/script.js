/**
 * SIMULATOR LOGIK - FINAL VERSION
 */

let questions = [];
let userAnswers = {}; 
let currentIdx = 0;
let timerInterval;
let timeLeft;
let isFinished = false;

// DOM Elemente
const startBtn = document.getElementById('start-btn');
const optionsContainer = document.getElementById('options-container');
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggle-sidebar');

// 1. JSON-VERARBEITUNG
document.getElementById('json-upload').addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            questions = JSON.parse(event.target.result);
            startBtn.disabled = false;
        } catch { alert("Fehler: JSON-Datei ist ungültig."); }
    };
    reader.readAsText(e.target.files[0]);
});

// 2. SIDEBAR TOGGLE
toggleBtn.onclick = () => {
    sidebar.classList.toggle('collapsed');
    toggleBtn.textContent = sidebar.classList.contains('collapsed') ? '☰' : '✕';
};

// 3. START & NAVIGATION
startBtn.onclick = () => {
    document.getElementById('setup-container').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    
    const nav = document.getElementById('question-nav');
    questions.forEach((_, i) => {
        const b = document.createElement('button');
        b.className = 'nav-btn';
        b.textContent = i + 1;
        b.id = `nav-btn-${i}`;
        b.onclick = () => showQuestion(i);
        nav.appendChild(b);
    });

    timeLeft = parseInt(document.getElementById('timer-input').value) * 60;
    startTimer();
    showQuestion(0);
};

function showQuestion(idx) {
    currentIdx = idx;
    const q = questions[idx];
    document.getElementById('question-text').textContent = q.frage;
    document.getElementById('question-counter').textContent = `Frage ${idx + 1} / ${questions.length}`;
    document.getElementById('progress-bar').style.width = `${((idx + 1) / questions.length) * 100}%`;
    
    optionsContainer.innerHTML = '';
    q.antworten.forEach((ans, i) => {
        const isChecked = userAnswers[idx]?.includes(i);
        const div = document.createElement('div');
        div.className = 'option-item fade-in';
        
        div.innerHTML = `
            <input type="checkbox" id="opt-${i}" ${isChecked ? 'checked' : ''} ${isFinished ? 'disabled' : ''}>
            <label for="opt-${i}">${ans.text}</label>
        `;

        if (!isFinished) {
            div.onclick = (e) => {
                if(e.target.tagName !== 'INPUT') {
                    const cb = div.querySelector('input');
                    cb.checked = !cb.checked;
                }
                saveAnswer(idx);
            };
        } else {
            if (isChecked && ans.korrekt) div.classList.add('correct-marked');
            if (isChecked && !ans.korrekt) div.classList.add('incorrect-marked');
            if (!isChecked && ans.korrekt) div.classList.add('missing-correct');
        }
        optionsContainer.appendChild(div);
    });

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`nav-btn-${idx}`).classList.add('active');
}

function saveAnswer(qIdx) {
    const checks = Array.from(optionsContainer.querySelectorAll('input:checked'))
                        .map(i => parseInt(i.id.split('-')[1]));
    userAnswers[qIdx] = checks;
    document.getElementById(`nav-btn-${qIdx}`).classList.toggle('answered', checks.length > 0);
}

// 4. PUNKTESYSTEM (Entscheidungs-Logik)
function calculatePoints() {
    let totalScore = 0;
    let maxPossible = 0;

    const details = questions.map((q, idx) => {
        let qPoints = 0;
        const userPicks = userAnswers[idx] || [];

        q.antworten.forEach((ans, i) => {
            const hasChecked = userPicks.includes(i);
            
            // Regel: Jede richtige Übereinstimmung (Haken oder kein Haken) zählt
            if (ans.korrekt) {
                hasChecked ? qPoints += 1 : qPoints -= 1;
            } else {
                !hasChecked ? qPoints += 1 : qPoints -= 1;
            }
        });

        // Limitierung pro Frage (0 bis 4)
        qPoints = Math.max(0, Math.min(4, qPoints));
        totalScore += qPoints;
        maxPossible += 4;
        return { points: qPoints };
    });

    return { totalScore, maxPossible, details };
}

// 5. TEST BEENDEN & REVIEW
function finishQuiz(forced = false) {
    if (!forced && !confirm("Simulation beenden und abgeben?")) return;
    isFinished = true;
    clearInterval(timerInterval);
    
    const res = calculatePoints();
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('result-container').classList.remove('hidden');
    
    const perc = Math.round((res.totalScore / res.maxPossible) * 100);
    document.getElementById('score-display').innerHTML = `
        <div style="font-size: 5rem; color: var(--primary); font-weight: 800;">${perc}%</div>
        <p style="font-size: 1.2rem; color: #4b5563;">${res.totalScore} von ${res.maxPossible} Punkten</p>
    `;
    
    const list = document.getElementById('detailed-results');
    list.innerHTML = res.details.map((d, i) => `
        <div class="option-item" style="justify-content: space-between;">
            <span>Frage ${i+1}: <strong>${d.points} / 4 Pkt.</strong></span>
            <button class="btn-primary" onclick="reviewQuestion(${i})">Details</button>
        </div>
    `).join('');
}

window.reviewQuestion = (idx) => {
    document.getElementById('result-container').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    document.getElementById('review-banner').classList.remove('hidden');
    document.getElementById('back-to-results').classList.remove('hidden');
    document.getElementById('finish-btn').classList.add('hidden');
    showQuestion(idx);
};

document.getElementById('back-to-results').onclick = () => {
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('result-container').classList.remove('hidden');
};

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft/60), s = timeLeft%60;
        document.getElementById('timer-display').textContent = `${m}:${s.toString().padStart(2,'0')}`;
        if(timeLeft <= 0) finishQuiz(true);
    }, 1000);
}

document.getElementById('next-btn').onclick = () => currentIdx < questions.length-1 && showQuestion(currentIdx+1);
document.getElementById('prev-btn').onclick = () => currentIdx > 0 && showQuestion(currentIdx-1);
document.getElementById('finish-btn').onclick = () => finishQuiz();