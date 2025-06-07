let ALL_PHRASES = [];
fetch('sentences.txt')
  .then(res => res.text())
  .then(text => {
    ALL_PHRASES = text.split('\n').map(l => l.trim()).filter(l => l);
    document.getElementById('phrase-count').max = ALL_PHRASES.length;
    document.getElementById('phrase-count').value = Math.min(5, ALL_PHRASES.length);
  })
  .catch(err => console.error('Erreur chargement phrases:', err));

const startBtn = document.getElementById('startBtn');
const modalBg = document.getElementById('modalBg');
const userForm = document.getElementById('userForm');
const errorDiv = document.getElementById('form-error');
const consentCheckbox = document.getElementById('consent');
const recorderScreen = document.getElementById('recorder-screen');
const backHomeBtn = document.getElementById('back-home-btn');
const phraseCountZone = document.getElementById('phrase-count-zone');
const confirmCountBtn = document.getElementById('confirm-count-btn');

const startRecBtn = document.getElementById('start-recording-btn');
const phraseZone = document.getElementById('phrase-zone');
const recControls = document.getElementById('rec-controls');
const recBtn = document.getElementById('rec-btn');
const stopBtn = document.getElementById('stop-btn');
const playBtn = document.getElementById('play-btn');
const redoBtn = document.getElementById('redo-btn');
const saveBtn = document.getElementById('valider-btn');
const continuerBtn = document.getElementById('continuer-btn');
const terminerBtn = document.getElementById('terminer-btn');
const audioPreview = document.getElementById('audio-preview');

startBtn.onclick = () => {
  modalBg.classList.add('show');
  errorDiv.style.display = "none";
};
consentCheckbox.onchange = () => {
  if (consentCheckbox.checked) errorDiv.style.display = "none";
};

let userInfos = {};

let phraseCount = 1;
let sessionPhrases = [];
let currentIndex = 0;


userForm.onsubmit = e => {
  e.preventDefault();
  const age = document.getElementById('age').value;
  const gender = document.getElementById('gender').value;
  const consent = consentCheckbox.checked;
  if (!consent) {
    errorDiv.textContent = "Veuillez accepter les conditions pour continuer.";
    errorDiv.style.display = "block";
    return;
  }
  userInfos = { age, gender, consent };
  errorDiv.style.display = "none";
  modalBg.classList.remove('show');
  startBtn.style.display = "none";
  recorderScreen.style.display = "flex";
  phraseCountZone.style.display = "block";
};


confirmCountBtn.onclick = () => {
  phraseCount = parseInt(document.getElementById('phrase-count').value, 10);
  if (isNaN(phraseCount) || phraseCount < 1 || phraseCount > ALL_PHRASES.length) {
    alert(`Merci de choisir un nombre entre 1 et ${ALL_PHRASES.length}`);
    return;
  }
  sessionPhrases = ALL_PHRASES
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, phraseCount);
  phraseCountZone.style.display = "none";
  startRecBtn.style.display = "inline-block";
  currentIndex = 0;
};

startRecBtn.onclick = prepareNextRecording;

function showValidateButtons() {
  saveBtn.style.display = "none";
  continuerBtn.style.display = "none";
  terminerBtn.style.display = "none";

  const isLast = currentIndex === sessionPhrases.length - 1;
  if (sessionPhrases.length === 1 || isLast) {
    saveBtn.textContent = "Valider et terminer";
    saveBtn.style.display = "inline-block";
  } else {
    continuerBtn.textContent = "Valider et continuer";
    continuerBtn.style.display = "inline-block";
  }
  terminerBtn.style.display = "inline-block";
}


let recorder, audioChunks = [], audioBlob;
let selectedPhrase = "";


recBtn.onclick = async () => {
  if (!navigator.mediaDevices) {
    alert("Ce navigateur ne supporte pas l'enregistrement audio.");
    return;
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const options = { mimeType: 'audio/webm;codecs=opus' };
  recorder = new MediaRecorder(stream, options);
  audioChunks = [];
  recorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) audioChunks.push(e.data);
  };
  recorder.onstop = () => {
    audioBlob = new Blob(audioChunks, { type: recorder.mimeType });
    console.log('➡️ chunks enregistrés :', audioChunks.length);
    console.log('➡️ taille du Blob :', audioBlob.size, 'octets');
    audioPreview.src = URL.createObjectURL(audioBlob);
    audioPreview.style.display = "block";
    playBtn.disabled = false;
    redoBtn.disabled = false;
    if (sessionPhrases.length === 1 || currentIndex === sessionPhrases.length - 1) {
      saveBtn.disabled = false;
    } else {
      continuerBtn.disabled = false;
    }
  };
  recorder.start();
  recBtn.disabled = true;
  stopBtn.disabled = false;
  playBtn.disabled = true;
  redoBtn.disabled = true;
};

stopBtn.onclick = () => {
  recorder.stop();
  recBtn.disabled = false;
  stopBtn.disabled = true;
};

playBtn.onclick = () => {
  audioPreview.pause();
  audioPreview.currentTime = 0;
  audioPreview.src = URL.createObjectURL(audioBlob);
  audioPreview.load();  
  audioPreview.play().catch(err => {
    alert("Impossible de jouer l'audio : " + err.message);
  });
};

redoBtn.onclick = () => {
  audioBlob = null;
  audioPreview.style.display = "none";
  recBtn.disabled = false;
  stopBtn.disabled = true;
  playBtn.disabled = true;
  redoBtn.disabled = true;
  saveBtn.disabled = true;
  continuerBtn.disabled = true;
};

saveBtn.onclick = async () => {
  if (!audioBlob) return alert("Aucun enregistrement à envoyer !");
  await sendAudio();
  alert("Session terminée ! Merci !");
  resetSession();
};

continuerBtn.onclick = async () => {
  if (!audioBlob) return alert("Aucun enregistrement à envoyer !");
  await sendAudio();
  currentIndex++;
  if (currentIndex < sessionPhrases.length) {
    prepareNextRecording();
  } else {
    alert("Session terminée ! Merci !");
    resetSession();
  }
};

function prepareNextRecording() {
  selectedPhrase = sessionPhrases[currentIndex];
  phraseZone.textContent = `Phrase ${currentIndex + 1} / ${sessionPhrases.length} : « ${selectedPhrase} »`;
  phraseZone.style.display = "block";
  recControls.style.display = "flex";
  startRecBtn.style.display = "none";

  recBtn.disabled = false;
  stopBtn.disabled = true;
  playBtn.disabled = true;
  redoBtn.disabled = true;
  saveBtn.disabled = true;
  continuerBtn.disabled = true;
  terminerBtn.disabled = false;
  audioPreview.style.display = "none";
  showValidateButtons();
}

terminerBtn.onclick = () => {
  if (confirm("Terminer la session ? Les enregistrements non faits ne seront pas sauvegardés.")) {
    resetSession();
  }
};

async function sendAudio() {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("age", userInfos.age);
  formData.append("gender", userInfos.gender);
  formData.append("consent", userInfos.consent);
  formData.append("sentence", selectedPhrase);

  try {
    await fetch("http://localhost:3001/api/upload", {
      method: "POST",
      body: formData
    });
  } catch (err) {
    console.error('Erreur envoi audio:', err);
  }
}

backHomeBtn.onclick = resetSession;
function resetSession() {
  recorderScreen.style.display = "none";
  startBtn.style.display = "inline-block";
  phraseZone.style.display = "none";
  recControls.style.display = "none";
  startRecBtn.style.display = "none";
  audioPreview.src = "";
  audioPreview.style.display = "none";
  userInfos = {};
  phraseCountZone.style.display = "none";
}
