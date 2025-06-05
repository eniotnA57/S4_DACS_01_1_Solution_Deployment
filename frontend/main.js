// 1. CHARGEMENT DES PHRASES
let ALL_PHRASES = [];
fetch('sentences.txt') // ← ou phrases.txt selon ton fichier
  .then(res => res.text())
  .then(text => {
    ALL_PHRASES = text.split('\n').map(l => l.trim()).filter(l => l);
    document.getElementById('phrase-count').max = ALL_PHRASES.length;
    document.getElementById('phrase-count').value = Math.min(5, ALL_PHRASES.length);
  });

const startBtn = document.getElementById('startBtn');
const modalBg = document.getElementById('modalBg');
const userForm = document.getElementById('userForm');
const errorDiv = document.getElementById('form-error');
const consentCheckbox = document.getElementById('consent');
const recorderScreen = document.getElementById('recorder-screen');
const backHomeBtn = document.getElementById('back-home-btn');
const phraseCountZone = document.getElementById('phrase-count-zone');
const confirmCountBtn = document.getElementById('confirm-count-btn');

// Boutons d'action
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

// Consentement UX
startBtn.onclick = () => {
  modalBg.classList.add('show');
  errorDiv.style.display = "none";
};
consentCheckbox.onchange = () => {
  if (consentCheckbox.checked) errorDiv.style.display = "none";
};

// Infos utilisateur mémorisées
let userInfos = {};

// Pour la session
let phraseCount = 1;
let sessionPhrases = [];
let currentIndex = 0;

// --- FORMULAIRE UTILISATEUR ---
userForm.onsubmit = (e) => {
  e.preventDefault();
  const age = document.getElementById('age').value;
  const gender = document.getElementById('gender').value;
  const consent = consentCheckbox.checked;
  if (!consent) {
    errorDiv.textContent = "Veuillez accepter les conditions pour continuer.";
    errorDiv.style.display = "block";
    return;
  }
  errorDiv.style.display = "none";
  userInfos = { age, gender, consent };

  modalBg.classList.remove('show');
  startBtn.style.display = "none";
  recorderScreen.style.display = "flex";
  recorderScreen.style.flexDirection = "column";
  recorderScreen.style.alignItems = "center";
  phraseCountZone.style.display = "block";
  startRecBtn.style.display = "none";
  phraseZone.style.display = "none";
  recControls.style.display = "none";
};

// --- NOMBRE DE PHRASES ---
confirmCountBtn.onclick = () => {
  phraseCount = parseInt(document.getElementById('phrase-count').value, 10);
  if (isNaN(phraseCount) || phraseCount < 1 || phraseCount > ALL_PHRASES.length) {
    alert(`Merci de choisir un nombre entre 1 et ${ALL_PHRASES.length}`);
    return;
  }
  // Mélange et sélectionne les phrases pour la session, sans doublons
  sessionPhrases = ALL_PHRASES.slice().sort(() => Math.random() - 0.5).slice(0, phraseCount);
  currentIndex = 0;
  phraseCountZone.style.display = "none";
  startRecBtn.style.display = "inline-block";
};


let recorder, audioChunks = [], audioBlob;
let selectedPhrase = "";

startRecBtn.onclick = prepareNextRecording;


function showValidateButtons() {
  // D'abord, tout cacher
  saveBtn.style.display = "none";
  continuerBtn.style.display = "none";
  terminerBtn.style.display = "none";

  if (sessionPhrases.length === 1) {
    // 1 phrase
    saveBtn.textContent = "Valider et terminer";
    saveBtn.style.display = "inline-block";
    terminerBtn.style.display = "inline-block";
  } else {
    // Plusieurs phrases
    if (currentIndex < sessionPhrases.length - 1) {
      continuerBtn.textContent = "Valider et continuer";
      continuerBtn.style.display = "inline-block";
      terminerBtn.style.display = "inline-block";
    } else {
      saveBtn.textContent = "Valider et terminer";
      saveBtn.style.display = "inline-block";
      terminerBtn.style.display = "inline-block";
    }
  }
}

// 2. Démarrer enregistrement
recBtn.onclick = async () => {
  if (!navigator.mediaDevices) {
    alert("Ce navigateur ne supporte pas l'enregistrement audio.");
    return;
  }
  let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recorder = new MediaRecorder(stream);
  audioChunks = [];
  recorder.ondataavailable = e => audioChunks.push(e.data);
  recorder.onstop = () => {
    audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
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
  saveBtn.disabled = true;
  continuerBtn.disabled = true;
};

// 3. Arrêter l’enregistrement
stopBtn.onclick = () => {
  recorder.stop();
  recBtn.disabled = false;
  stopBtn.disabled = true;
};

// 4. Réécouter
playBtn.onclick = () => {
  // Pour éviter les bugs de lecture consécutive
  audioPreview.pause();
  audioPreview.currentTime = 0;
  // Recharge la source, important si on a réenregistré
  audioPreview.src = URL.createObjectURL(audioBlob);
  audioPreview.play().catch(err => {
    alert("Impossible de jouer l'audio : " + err.message);
  });
};


// 5. Réenregistrer
redoBtn.onclick = () => {
  audioBlob = null;
  audioPreview.src = "";
  audioPreview.style.display = "none";
  recBtn.disabled = false;
  stopBtn.disabled = true;
  playBtn.disabled = true;
  redoBtn.disabled = true;
  saveBtn.disabled = true;
  continuerBtn.disabled = true;
};

// ----------- Validation / progression ----------- //

// Valider et terminer
saveBtn.onclick = async () => {
  if (!audioBlob) {
    alert("Aucun enregistrement à envoyer !");
    return;
  }
  await sendAudio();
  alert("Session terminée ! Merci !");
  resetSession();
};

// Valider et continuer
continuerBtn.onclick = async () => {
  if (!audioBlob) {
    alert("Aucun enregistrement à envoyer !");
    return;
  }
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
  phraseZone.textContent = `Phrase ${currentIndex+1} / ${sessionPhrases.length} : « ${selectedPhrase} »`;
  phraseZone.style.display = "block";
  recControls.style.display = "flex";
  startRecBtn.style.display = "none";
  // Remise à zéro des états boutons et de l’audio
  recBtn.disabled = false;
  stopBtn.disabled = true;
  playBtn.disabled = true;
  redoBtn.disabled = true;
  saveBtn.disabled = true;
  continuerBtn.disabled = true;
  terminerBtn.disabled = false;
  audioPreview.style.display = "none";
  audioPreview.src = "";
  audioBlob = null;
  showValidateButtons();
}



// Terminer la session en cours de route
terminerBtn.onclick = () => {
  if (confirm("Terminer la session ? Les enregistrements non faits ne seront pas sauvegardés.")) {
    resetSession();
  }
};

// Envoi au backend
async function sendAudio() {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("age", userInfos.age);
  formData.append("gender", userInfos.gender);
  formData.append("consent", userInfos.consent);
  formData.append("sentence", selectedPhrase);

  await fetch("http://localhost:3001/api/upload", {
    method: "POST",
    body: formData
  });
}

// Retour accueil (croix)
backHomeBtn.onclick = () => {
  resetSession();
};

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
