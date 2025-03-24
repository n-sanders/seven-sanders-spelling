let currentSessionWords = [];
let currentWordIndex = 0;
let currentWord = '';
let wordLength = 0;
let enteredLetters = [];
let currentPos = 0;
let currentAttempts = 0;
let allWords = [];

// Load the word list from words.json
fetch('/data/words.json')
  .then(response => response.json())
  .then(data => {
    allWords = data;
    loadProgress();
  })
  .catch(err => console.error('Error loading words:', err));

function loadProgress() {
  const progress = JSON.parse(localStorage.getItem('progress') || '{"wordResults": {}, "currentIndex": 0}');
  let wordsToInclude = Object.keys(progress.wordResults).filter(word => progress.wordResults[word] !== "correct-first");
  let numToAdd = 10 - wordsToInclude.length;
  if (numToAdd > 0) {
    let newWords = allWords.slice(progress.currentIndex, progress.currentIndex + numToAdd).map(w => w.word);
    wordsToInclude = wordsToInclude.concat(newWords);
    progress.currentIndex += numToAdd;
    localStorage.setItem('progress', JSON.stringify(progress));
  }
  currentSessionWords = wordsToInclude;
  currentWordIndex = 0;
  loadWord();
}

function loadWord() {
  if (currentWordIndex < currentSessionWords.length) {
    currentWord = currentSessionWords[currentWordIndex];
    wordLength = currentWord.length;
    enteredLetters = new Array(wordLength).fill('');
    currentPos = 0;
    currentAttempts = 0;
    createWordBlanks(wordLength);
    document.getElementById('check-btn').disabled = true;
    document.getElementById('feedback').textContent = '';
  } else {
    document.getElementById('app').style.display = 'none';
    document.getElementById('session-complete').style.display = 'block';
  }
}

function createWordBlanks(length) {
  const container = document.getElementById('word-container');
  container.innerHTML = '';
  for (let i = 0; i < length; i++) {
    const box = document.createElement('div');
    box.className = 'letter-box';
    box.textContent = '_';
    box.dataset.index = i; // Store the index for clicking
    box.addEventListener('click', () => {
      currentPos = parseInt(box.dataset.index);
      highlightActiveBox();
    });
    container.appendChild(box);
  }
  highlightActiveBox();
}

function highlightActiveBox() {
  const boxes = document.querySelectorAll('.letter-box');
  boxes.forEach((box, index) => {
    box.style.backgroundColor = index === currentPos ? '#e0e0e0' : 'white';
  });
}

function createKeyboard() {
  const keyboard = document.getElementById('keyboard');
  for (let i = 65; i <= 90; i++) {
    const button = document.createElement('button');
    button.textContent = String.fromCharCode(i);
    button.addEventListener('click', () => onLetterInput(button.textContent));
    keyboard.appendChild(button);
  }
  // Add backspace button
  const backspaceBtn = document.createElement('button');
  backspaceBtn.textContent = '⌫';
  backspaceBtn.style.width = '60px';
  backspaceBtn.addEventListener('click', onBackspace);
  keyboard.appendChild(backspaceBtn);
}

function onLetterInput(letter) {
  if (currentPos < wordLength) {
    enteredLetters[currentPos] = letter.toLowerCase();
    document.querySelectorAll('.letter-box')[currentPos].textContent = letter;
    currentPos++;
    if (currentPos === wordLength) {
      document.getElementById('check-btn').disabled = false;
    } else {
      highlightActiveBox();
    }
  }
}

function onBackspace() {
  if (currentPos > 0) {
    currentPos--;
    enteredLetters[currentPos] = '';
    document.querySelectorAll('.letter-box')[currentPos].textContent = '_';
    document.getElementById('check-btn').disabled = true;
    highlightActiveBox();
  }
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
  if (e.key >= 'a' && e.key <= 'z') {
    onLetterInput(e.key.toUpperCase());
  } else if (e.key === 'Backspace') {
    onBackspace();
  }
});

// Check button logic
document.getElementById('check-btn').addEventListener('click', () => {
  const userInput = enteredLetters.join('');
  if (userInput === currentWord) {
    let result = currentAttempts === 0 ? 'correct-first' : 'correct-second';
    showFeedback('Correct!');
    updateProgress(currentWord, currentAttempts + 1, result);
    setTimeout(nextWord, 2000);
  } else {
    currentAttempts++;
    if (currentAttempts < 2) {
      showFeedback('Try again');
    } else {
      showFeedback(`The word is "${currentWord}"`);
      updateProgress(currentWord, 2, 'incorrect');
      setTimeout(nextWord, 3000);
    }
  }
});

function showFeedback(message) {
  document.getElementById('feedback').textContent = message;
}

function updateProgress(word, attempts, result) {
  let progress = JSON.parse(localStorage.getItem('progress') || '{"wordResults": {}, "currentIndex": 0}');
  progress.wordResults[word] = result;
  localStorage.setItem('progress', JSON.stringify(progress));
}

function nextWord() {
  currentWordIndex++;
  loadWord();
}

// Speaker button
document.getElementById('speaker-btn').addEventListener('click', () => {
  // Find the prompt for the current word
  const wordData = allWords.find(w => w.word === currentWord);
  const prompt = wordData ? wordData.prompt : `${currentWord}.`;

  fetch(`/api/getAudio?word=${currentWord}&prompt=${encodeURIComponent(prompt)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error);
      }
      const audio = new Audio(data.audio); // Base64 data URL
      audio.play();
    })
    .catch(err => console.error('Error playing audio:', err));
});
// Next session button
document.getElementById('next-session-btn').addEventListener('click', () => {
  document.getElementById('session-complete').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  loadProgress();
});

// Initialize the virtual keyboard
createKeyboard();