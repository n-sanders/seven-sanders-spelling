let currentSessionWords = [];
let currentWordIndex = 0;
let currentWord = '';
let wordLength = 0;
let enteredLetters = [];
let currentPos = 0;
let currentAttempts = 0;
let allWords = [];
let spellingListTitle = '';
let spellingListDescription = '';
let currentListId = '';
let availableLists = [];

// Function to load available spelling lists
function loadAvailableLists() {
  fetch('/api/getLists')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      availableLists = data.lists;
      displayListOptions(availableLists);
    })
    .catch(err => {
      console.error('Error loading lists:', err);
      // Fallback to hard-coded lists if API fails
      availableLists = [
        { id: 'dolch-k', name: 'Dolch Kindergarten' },
        { id: 'dolch-1', name: 'Dolch First Grade' }
      ];
      displayListOptions(availableLists);
    });
}

// Function to display list options
function displayListOptions(lists) {
  const container = document.getElementById('lists-container');
  container.innerHTML = '';

  lists.forEach(list => {
    const listEl = document.createElement('div');
    listEl.className = 'list-option';
    listEl.dataset.id = list.id;

    // Calculate progress for this list
    const progressKey = `progress-${list.id}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{"wordResults": {}}');
    
    // Load list title and description
    fetch(`/data/${list.id}.json`)
      .then(response => response.json())
      .then(data => {
        // Calculate mastery percentage
        const totalWords = data.words.length;
        const masteredWords = Object.entries(progress.wordResults).filter(
          ([word, result]) => result === 'correct-first'
        ).length;
        
        const masteryPercentage = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;
        
        listEl.innerHTML = `
          <div class="list-title">${data.title}</div>
          <div class="list-description">${data.description}</div>
          <div class="list-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${masteryPercentage}%"></div>
            </div>
            <div class="progress-text">${masteredWords} of ${totalWords} words mastered (${masteryPercentage}%)</div>
          </div>
        `;
      })
      .catch(err => {
        console.error(`Error loading list details for ${list.id}:`, err);
        listEl.innerHTML = `
          <div class="list-title">${list.name}</div>
          <div class="list-description">Spelling list</div>
          <div class="list-progress">Progress not available</div>
        `;
      });

    listEl.addEventListener('click', () => selectList(list.id));
    container.appendChild(listEl);
  });
}

// Function to select and load a list
function selectList(listId) {
  currentListId = listId;
  document.getElementById('list-selection').style.display = 'none';
  document.getElementById('app').style.display = 'block';

  // Load the selected list
  fetch(`/data/${listId}.json`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      allWords = data.words;
      spellingListTitle = data.title;
      spellingListDescription = data.description;

      const titleElement = document.getElementById('list-title');
      const descriptionElement = document.getElementById('list-description');
      if (titleElement) {
        titleElement.textContent = spellingListTitle;
      }
      if (descriptionElement) {
        descriptionElement.textContent = spellingListDescription;
      }

      // Update mastery count display
      updateMasteryProgress();

      loadProgress();
    })
    .catch(err => console.error(`Error loading list ${listId}:`, err));
}

// Function to load progress
function loadProgress() {
  // Get progress from localStorage, or initialize with empty wordResults if not found
  const progressKey = `progress-${currentListId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{"wordResults": {}}');
  
  // Start with words that were attempted but not correct on first try
  let wordsToInclude = Object.keys(progress.wordResults)
    .filter(word => progress.wordResults[word] !== "correct-first")
    .slice(0, 10); // Limit to 10 words
  
  // If we need more words, add new ones that haven't been attempted yet
  const numToAdd = 10 - wordsToInclude.length;
  if (numToAdd > 0) {
    // Find words that haven't been attempted yet
    const attemptedWords = new Set(Object.keys(progress.wordResults));
    const newWords = allWords
      .filter(wordObj => !attemptedWords.has(wordObj.word))
      .slice(0, numToAdd)
      .map(wordObj => wordObj.word);
    
    wordsToInclude = wordsToInclude.concat(newWords);
  }
  
  currentSessionWords = wordsToInclude;
  currentWordIndex = 0;
  loadWord();
}

// Function to load a word
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

// Function to create word blanks
function createWordBlanks(length) {
  const container = document.getElementById('word-container');
  container.innerHTML = '';
  for (let i = 0; i < length; i++) {
    const box = document.createElement('div');
    box.className = 'letter-box';
    box.textContent = '_';
    box.dataset.index = i;
    box.addEventListener('click', () => {
      currentPos = parseInt(box.dataset.index);
      highlightActiveBox();
    });
    container.appendChild(box);
  }
  highlightActiveBox();
}

// Function to highlight active box
function highlightActiveBox() {
  const boxes = document.querySelectorAll('.letter-box');
  boxes.forEach((box, index) => {
    box.style.backgroundColor = index === currentPos ? '#e0e0e0' : 'white';
  });
}

// Function to create keyboard
function createKeyboard() {
  const keyboard = document.getElementById('keyboard');
  for (let i = 65; i <= 90; i++) {
    const button = document.createElement('button');
    button.textContent = String.fromCharCode(i);
    button.addEventListener('click', () => onLetterInput(button.textContent));
    keyboard.appendChild(button);
  }
  const backspaceBtn = document.createElement('button');
  backspaceBtn.textContent = '⌫';
  backspaceBtn.style.width = '60px';
  backspaceBtn.addEventListener('click', onBackspace);
  keyboard.appendChild(backspaceBtn);
}

// Function to handle letter input
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

// Function to handle backspace
function onBackspace() {
  if (currentPos > 0) {
    currentPos--;
    enteredLetters[currentPos] = '';
    document.querySelectorAll('.letter-box')[currentPos].textContent = '_';
    document.getElementById('check-btn').disabled = true;
    highlightActiveBox();
  }
}

// Function to update progress
function updateProgress(word, attempts, result) {
  const progressKey = `progress-${currentListId}`;
  let progress = JSON.parse(localStorage.getItem(progressKey) || '{"wordResults": {}}');
  progress.wordResults[word] = result;
  localStorage.setItem(progressKey, JSON.stringify(progress));
  
  // Update mastery count display after updating progress
  updateMasteryProgress();
}

// Function to calculate and display mastery progress
function updateMasteryProgress() {
  const progressKey = `progress-${currentListId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{"wordResults": {}}');
  const totalWords = allWords.length;
  
  // Count words that have been mastered (correct on first try)
  const masteredWords = Object.entries(progress.wordResults).filter(
    ([word, result]) => result === 'correct-first'
  ).length;
  
  // Update display in the app view
  document.getElementById('mastered-count').textContent = masteredWords;
  document.getElementById('total-count').textContent = totalWords;
  
  // Update display in the session complete view
  document.getElementById('session-mastered-count').textContent = masteredWords;
  document.getElementById('session-total-count').textContent = totalWords;
}

// Function to go to next word
function nextWord() {
  currentWordIndex++;
  loadWord();
}

// Function to show feedback
function showFeedback(message) {
  document.getElementById('feedback').textContent = message;
}

// Function to change list
function changeList() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('session-complete').style.display = 'none';
  document.getElementById('list-selection').style.display = 'block';
  
  // Reload the list options to refresh progress information
  loadAvailableLists();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  createKeyboard();
  loadAvailableLists();
  
  // Check button
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

  // Speaker button
  document.getElementById('speaker-btn').addEventListener('click', () => {
    // Find the word data for the current word
    const wordData = allWords.find(w => w.word === currentWord);
    const audioFile = wordData ? wordData['audio-file'] : `${currentWord}`; // Use audio-file field
    const prompt = wordData ? wordData.prompt : `${currentWord}.`;

    fetch(`/api/getAudio?word=${audioFile}&prompt=${encodeURIComponent(prompt)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        const audio = new Audio(data.audio);
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

  // Change list buttons
  document.getElementById('change-list-btn').addEventListener('click', changeList);
  document.getElementById('change-list-btn-complete').addEventListener('click', changeList);
});

document.addEventListener('keydown', (e) => {
  if (e.key >= 'a' && e.key <= 'z') {
    onLetterInput(e.key.toUpperCase());
  } else if (e.key === 'Backspace') {
    onBackspace();
  }
});