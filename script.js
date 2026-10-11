const tg = window.Telegram.WebApp;
tg.expand();

const hamster = document.getElementById('hamster');
const coinsDisplay = document.getElementById('coins');
const messageDisplay = document.getElementById('message');
const boostBtn = document.getElementById('boostBtn');
const boostStatus = document.getElementById('boostStatus');
const clickSound = document.getElementById('clickSound');

// Загружаем данные
let coins = parseInt(localStorage.getItem('tg_coins')) || 0;
let boostActive = localStorage.getItem('tg_boost') === 'true';
let boostTimeLeft = parseInt(localStorage.getItem('tg_boost_time')) || 0;
let baseClickValue = 1;

// Обновляем отображение при загрузке
coinsDisplay.textContent = coins;
updateBoostUI();

// Звук (на мобильных браузерах часто требует первого клика для разблокировки)
function playSound() {
    const promise = clickSound.play();
    if (promise !== undefined) {
        promise.catch(error => console.log("Звук заблокирован браузером:", error));
    }
}

// Функция сохранения
function saveGame() {
    localStorage.setItem('tg_coins', coins);
    localStorage.setItem('tg_boost', boostActive);
    localStorage.setItem('tg_boost_time', boostTimeLeft);
}

// Обновление интерфейса буста
function updateBoostUI() {
    if (boostActive && boostTimeLeft > 0) {
        boostBtn.disabled = true;
        boostBtn.textContent = `Буст активен (${boostTimeLeft}s)`;
        boostStatus.textContent = "Каждый клик дает 5 монет!";
        boostStatus.style.color = "#4CAF50";
    } else {
        boostActive = false;
        boostTimeLeft = 0;
        boostBtn.disabled = coins < 50;
        boostBtn.textContent = "Купить буст (50 монет)";
        boostStatus.textContent = "";
    }
    saveGame();
}

// Логика клика
hamster.addEventListener('click', function() {
    // Считаем монеты (5 если буст, 1 если нет)
    const gain = (boostActive && boostTimeLeft > 0) ? 5 : 1;
    coins += gain;
    coinsDisplay.textContent = coins;
    
    playSound();
    
    // Сообщение
    messageDisplay.textContent = `+${gain} монет!`;
    setTimeout(() => messageDisplay.textContent = "", 800);
    
    // Проверяем, накопили ли на буст
    boostBtn.disabled = coins < 50;
    
    saveGame();
});

// Логика покупки буста
boostBtn.addEventListener('click', function() {
    if (coins >= 50 && !boostActive) {
        coins -= 50;
        boostActive = true;
        boostTimeLeft = 10; // Буст работает 10 секунд
        
        // Запускаем таймер
        const timer = setInterval(() => {
            boostTimeLeft--;
            updateBoostUI();
            if (boostTimeLeft <= 0) {
                clearInterval(timer);
                updateBoostUI();
            }
        }, 1000);
        
        saveGame();
    }
});

// Запускаем таймер буста, если игрок перезашел в игру, пока буст еще работал
if (boostActive && boostTimeLeft > 0) {
    const timer = setInterval(() => {
        boostTimeLeft--;
        updateBoostUI();
        if (boostTimeLeft <= 0) {
            clearInterval(timer);
            updateBoostUI();
        }
    }, 1000);
}

// Кнопка сброса в шапке Telegram
tg.MainButton.setText("Сбросить прогресс");
tg.MainButton.onClick(function() {
    if (confirm("Вы точно хотите обнулить все монеты и бусты?")) {
        localStorage.clear();
        coins = 0;
        boostActive = false;
        boostTimeLeft = 0;
        coinsDisplay.textContent = 0;
        updateBoostUI();
        tg.MainButton.hide();
    }
});
