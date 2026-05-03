const affectionValue = document.getElementById("affectionValue");
const affectionBar = document.getElementById("affectionBar");
const dialogueText = document.getElementById("dialogueText");
const choicesEl = document.getElementById("choices");
const speakerEl = document.getElementById("speaker");
const chapterEl = document.getElementById("chapter");
const hintEl = document.getElementById("hint");
const restartButton = document.getElementById("restartButton");
const musicButton = document.getElementById("musicButton");
const voiceButton = document.getElementById("voiceButton");
const replayButton = document.getElementById("replayButton");

const story = [
  {
    speaker: "凛",
    chapter: "Scene 1 / 雨宿り",
    text: "「隣、空いてますか？ 急に降られてしまって。……このカフェ、雨の音が近くて落ち着きますね」",
    choices: [
      { text: "タオルを差し出す", score: 12, next: 1, hint: "気遣いが自然に伝わりました" },
      { text: "天気の話で軽く笑う", score: 6, next: 1, hint: "緊張が少しほぐれました" },
      { text: "席だけ譲って黙る", score: 0, next: 1, hint: "まだ距離はあります" },
    ],
  },
  {
    speaker: "凛",
    chapter: "Scene 2 / 名刺",
    text: "「私、花澤凛です。ブックデザインの仕事をしていて、今日は打ち合わせ帰りなんです」",
    choices: [
      { text: "どんな本を作るのか聞く", score: 10, next: 2, hint: "凛は仕事の話を嬉しそうに始めました" },
      { text: "名前を褒める", score: 5, next: 2, hint: "少し照れたようです" },
      { text: "自分の話を長めにする", score: -4, next: 2, hint: "会話の温度が少し下がりました" },
    ],
  },
  {
    speaker: "凛",
    chapter: "Scene 3 / 価値観",
    text: "「表紙って、派手ならいいわけじゃなくて。手に取る人の生活まで想像したいんです」",
    choices: [
      { text: "その考え方、好きだと伝える", score: 12, next: 3, hint: "まっすぐな言葉に凛の目が和らぎました" },
      { text: "プロっぽいねと感心する", score: 7, next: 3, hint: "素直な反応として受け取られました" },
      { text: "売れれば正解では？ と返す", score: -8, next: 3, hint: "凛は少し考え込んでしまいました" },
    ],
  },
  {
    speaker: "凛",
    chapter: "Scene 4 / 小さな約束",
    text: "「このあと少しだけ時間があって。もしよければ、近くの古書店に寄りませんか？」",
    choices: [
      { text: "喜んで、とすぐ答える", score: 11, next: 4, hint: "凛は安心したように笑いました" },
      { text: "おすすめの棚を教えてほしい", score: 9, next: 4, hint: "次の会話が自然に決まりました" },
      { text: "今日は忙しいと断る", score: -12, next: 4, hint: "約束の芽は少し遠のきました" },
    ],
  },
  {
    speaker: "凛",
    chapter: "Scene 5 / 帰り道",
    text: "「今日は、初対面なのに不思議と話しやすかったです。……また会えたら、嬉しいな」",
    choices: [
      { text: "連絡先を交換したいと伝える", score: 13, next: "ending", hint: "凛はスマホを取り出しました" },
      { text: "次は晴れの日に誘う", score: 10, next: "ending", hint: "次の約束が柔らかく見えてきました" },
      { text: "会釈だけして別れる", score: -4, next: "ending", hint: "余韻は残りましたが、言葉は足りませんでした" },
    ],
  },
];

const endings = {
  best: {
    speaker: "凛",
    chapter: "Ending / 新しい栞",
    text: "「次に会う日、私が好きな本を一冊持ってきます。あなたにも、少しだけ私の世界を知ってほしいから」\n\nHappy End: 雨上がりの約束",
  },
  good: {
    speaker: "凛",
    chapter: "Ending / また今度",
    text: "「今日はありがとう。次に偶然じゃなく会えたら、その時はもう少しゆっくり話しましょう」\n\nGood End: 近づいた距離",
  },
  normal: {
    speaker: "凛",
    chapter: "Ending / カフェの記憶",
    text: "「雨、止みましたね。短い時間でしたけど、少し楽しかったです」\n\nNormal End: やさしい余韻",
  },
};

const state = {
  affection: 0,
  scene: 0,
  currentLine: "",
};

const voice = {
  enabled: true,
  selected: null,
  supported: "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
};

const music = {
  context: null,
  master: null,
  timer: null,
  step: 0,
  isPlaying: false,
  chords: [
    ["F4", "A4", "C5"],
    ["G4", "B4", "D5"],
    ["E4", "G4", "C5"],
    ["A3", "E4", "C5"],
  ],
  melody: ["C5", "E5", "G5", "E5", "D5", "B4", "C5", "A4"],
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function renderScene() {
  const item = story[state.scene];
  speakerEl.textContent = item.speaker;
  chapterEl.textContent = item.chapter;
  dialogueText.textContent = item.text;
  state.currentLine = item.text;
  choicesEl.innerHTML = "";

  item.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = choice.text;
    button.addEventListener("click", () => choose(choice));
    choicesEl.appendChild(button);
  });

  updateAffection();
  speakCurrentLine();
}

function choose(choice) {
  state.affection = clamp(state.affection + choice.score, 0, 100);
  hintEl.textContent = choice.hint;

  if (choice.next === "ending") {
    renderEnding();
    return;
  }

  state.scene = choice.next;
  renderScene();
}

function renderEnding() {
  const ending = state.affection >= 46
    ? endings.best
    : state.affection >= 26
      ? endings.good
      : endings.normal;

  speakerEl.textContent = ending.speaker;
  chapterEl.textContent = ending.chapter;
  dialogueText.textContent = ending.text;
  state.currentLine = ending.text;
  choicesEl.innerHTML = "";

  const restart = document.createElement("button");
  restart.type = "button";
  restart.textContent = "もう一度遊ぶ";
  restart.addEventListener("click", restartGame);
  choicesEl.appendChild(restart);

  hintEl.textContent = `最終好感度は ${state.affection} でした`;
  updateAffection();
  speakCurrentLine();
}

function updateAffection() {
  affectionValue.textContent = state.affection;
  affectionBar.style.width = `${state.affection}%`;
}

function restartGame() {
  stopVoice();
  state.affection = 0;
  state.scene = 0;
  hintEl.textContent = "選択肢で凛との距離が変わります";
  renderScene();
}

function loadVoice() {
  if (!voice.supported) {
    voiceButton.disabled = true;
    replayButton.disabled = true;
    hintEl.textContent = "このブラウザでは音声合成に対応していません";
    return;
  }

  const voices = window.speechSynthesis.getVoices();
  voice.selected =
    voices.find((item) => item.lang === "ja-JP" && /female|haruka|nanami|kyoko|ichiro/i.test(item.name)) ||
    voices.find((item) => item.lang === "ja-JP") ||
    voices.find((item) => item.lang.startsWith("ja")) ||
    null;
}

function cleanVoiceText(text) {
  return text
    .replace(/\n+/g, "。")
    .replace(/Happy End: .+|Good End: .+|Normal End: .+/g, "")
    .replace(/[「」]/g, "")
    .replace(/……/g, "、")
    .trim();
}

function stopVoice() {
  if (voice.supported) {
    window.speechSynthesis.cancel();
  }
}

function speakCurrentLine() {
  if (!voice.enabled || !voice.supported || !state.currentLine) {
    return;
  }

  loadVoice();
  stopVoice();

  const utterance = new SpeechSynthesisUtterance(cleanVoiceText(state.currentLine));
  utterance.lang = "ja-JP";
  utterance.pitch = 1.12;
  utterance.rate = 0.92;
  utterance.volume = 0.95;

  if (voice.selected) {
    utterance.voice = voice.selected;
  }

  window.speechSynthesis.speak(utterance);
}

function toggleVoice() {
  voice.enabled = !voice.enabled;
  voiceButton.setAttribute("aria-pressed", String(voice.enabled));
  voiceButton.textContent = voice.enabled ? "ボイス ON" : "ボイス";

  if (voice.enabled) {
    hintEl.textContent = "フルボイスを再生しています";
    speakCurrentLine();
  } else {
    stopVoice();
    hintEl.textContent = "ボイスを停止しました";
  }
}

function noteToFrequency(note) {
  const match = note.match(/^([A-G]#?)(\d)$/);
  const semitones = {
    C: -9,
    "C#": -8,
    D: -7,
    "D#": -6,
    E: -5,
    F: -4,
    "F#": -3,
    G: -2,
    "G#": -1,
    A: 0,
    "A#": 1,
    B: 2,
  };
  const [, pitch, octave] = match;
  return 440 * Math.pow(2, (semitones[pitch] + (Number(octave) - 4) * 12) / 12);
}

function createMusicContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  music.context = new AudioContext();
  music.master = music.context.createGain();
  music.master.gain.value = 0.18;
  music.master.connect(music.context.destination);
}

function playTone(note, start, duration, type, volume) {
  const oscillator = music.context.createOscillator();
  const gain = music.context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = noteToFrequency(note);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  oscillator.connect(gain);
  gain.connect(music.master);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
}

function playMusicStep() {
  const now = music.context.currentTime;
  const chord = music.chords[Math.floor(music.step / 4) % music.chords.length];

  if (music.step % 4 === 0) {
    chord.forEach((note, index) => {
      playTone(note, now + index * 0.015, 1.6, "triangle", 0.045);
    });
  }

  playTone(music.melody[music.step % music.melody.length], now, 0.34, "sine", 0.075);
  music.step += 1;
}

async function toggleMusic() {
  if (!music.context) {
    createMusicContext();
  }

  if (music.context.state === "suspended") {
    await music.context.resume();
  }

  music.isPlaying = !music.isPlaying;
  musicButton.setAttribute("aria-pressed", String(music.isPlaying));
  musicButton.textContent = music.isPlaying ? "音楽 ON" : "音楽";

  if (music.isPlaying) {
    playMusicStep();
    music.timer = window.setInterval(playMusicStep, 420);
    hintEl.textContent = "BGMを再生しています";
  } else {
    window.clearInterval(music.timer);
    music.timer = null;
    hintEl.textContent = "BGMを停止しました";
  }
}

if (voice.supported) {
  window.speechSynthesis.addEventListener("voiceschanged", loadVoice);
  loadVoice();
}

restartButton.addEventListener("click", restartGame);
musicButton.addEventListener("click", toggleMusic);
voiceButton.addEventListener("click", toggleVoice);
replayButton.addEventListener("click", speakCurrentLine);
renderScene();
