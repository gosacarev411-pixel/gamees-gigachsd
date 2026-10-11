const tg = window.Telegram.WebApp;
tg.expand();

// --- ЭЛЕМЕНТЫ СТРАНИЦЫ ---
const coinBtn = document.getElementById('coinBtn');
const coinsDisplay = document.getElementById('coins');
const messageDisplay = document.getElementById('message');
const shopBtn = document.getElementById('shopBtn');
const shopModal = document.getElementById('shopModal');
const closeShop = document.getElementById('closeShop');
const upgradesList = document.getElementById('upgradesList');
const autoIncomeDisplay = document.getElementById('autoIncome');

// --- БАЗОВЫЕ ДАННЫЕ ИГРЫ ---
let coins = parseInt(localStorage.getItem('tg_coins')) || 0;
let clickPower = 1; // Сколько монет дает один клик

// --- СПИСОК УЛУЧШЕНИЙ ---
const upgrades = [
    {
        id: 'click_1',
        name: 'Коврик для мыши',
        desc: 'Увеличивает доход за тап на 1',
        cost: 10,
        value: 1,
        type: 'click'
    },
    {
        id: 'click_2',
        name: 'Ореховая диета',
        desc: 'Увеличивает доход за тап на 5',
        cost: 50,
        value: 5,
        type: 'click'
    },
    {
        id: 'auto_1',
        name: 'Маленький друг',
        desc: 'Приносит 1 монету в секунду',
        cost: 25,
        value: 1,
        type: 'auto'
    },
    {
        id: 'auto_2',
        name: 'Хомячье колесо',
        desc: 'Приносит 5 монет в секунду',
        cost: 100,
        value: 5,
        type: 'auto'
    }
];

// Загружаем купленные улучшения
const ownedUpgrades = JSON.parse(localStorage.getItem('tg_owned')) || {};

// --- ФУНКЦИИ СОХРАНЕНИЯ И ОБНОВЛЕНИЯ ---
function saveGame() {
    localStorage.setItem('tg_coins', coins);
    localStorage.setItem('tg_owned', JSON.stringify(ownedUpgrades));
}

function updateCoins() {
    coinsDisplay.textContent = coins.toLocaleString();
}

// Считаем пассивный доход для отображения
function updateAutoIncome() {
    let income = 0;
    Object.keys(ownedUpgrades).forEach(key => {
        const upg = upgrades.find(u => u.id === key);
        if (upg && upg.type === 'auto') {
            income += upg.value * ownedUpgrades[key];
        }
    });
    autoIncomeDisplay.textContent = income;
}

// Показываем сообщение над монеткой
function showMessage(text) {
    messageDisplay.textContent = text;
    messageDisplay.classList.add('show');
    setTimeout(() => {
        messageDisplay.classList.remove('show');
    }, 800);
}

// --- ЛОГИКА КЛИКА (ТАПА) ---
coinBtn.addEventListener('click', () => {
    coins += clickPower;
    updateCoins();
    saveGame();
    showMessage(`+${clickPower}`);
});

// --- ЛОГИКА МАГАЗИНА ---
function renderShop() {
    upgradesList.innerHTML = '';
    
    upgrades.forEach(item => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';

        const owned = ownedUpgrades[item.id] || 0;
        
        // Считаем цену (каждая следующая покупка дороже на 15%)
        let currentCost = item.cost;
        if (owned > 0 && item.type === 'click') {
            currentCost = Math.floor(item.cost * Math.pow(1.15, owned));
        }

        // Если это авто-доход, показываем уровень (x1, x2)
        const levelText = (item.type === 'auto' && owned > 0) ? ` x${owned}` : '';

        card.innerHTML = `
            <div class="upgrade-info">
                <h3>${item.name}${levelText}</h3>
                <p>${item.desc}</p>
            </div>
            <div class="upgrade-buy">
                <button class="upgrade-btn ${owned && item.type !== 'auto' ? 'owned' : ''}" 
                        data-id="${item.id}" ${coins < currentCost || (owned && item.type !== 'auto') ? 'disabled' : ''}>
                    ${owned && item.type !== 'auto' ? '✓' : currentCost.toLocaleString()}
                </button>
            </div>
        `;
        upgradesList.appendChild(card);
    });

    // Вешаем обработчики на кнопки покупки
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const upgrade = upgrades.find(u => u.id === id);
            
            let cost = upgrade.cost;
            const owned = ownedUpgrades[id] || 0;
            
            if (owned > 0 && upgrade.type === 'click') {
                cost = Math.floor(upgrade.cost * Math.pow(1.15, owned));
            }

            if (coins >= cost) {
                coins -= cost;
                if (!ownedUpgrades[id]) {
                    ownedUpgrades[id] = 1;
                } else {
                    ownedUpgrades[id]++;
                }
                
                // Применяем эффект
                if (upgrade.type === 'click') {
                    clickPower += upgrade.value;
                }
                
                updateCoins();
                updateAutoIncome();
                saveGame();
                renderShop(); // Перерисовываем магазин с новыми ценами
            }
        });
    });
}

// --- АВТОМАТИЧЕСКИЙ ДОХОД (Auto-clickers) ---
setInterval(() => {
    let income = 0;
    Object.keys(ownedUpgrades).forEach(key => {
        const upg = upgrades.find(u => u.id === key);
        if (upg && upg.type === 'auto') {
            income += upg.value * ownedUpgrades[key];
        }
    });
    if (income > 0) {
        coins += income;
        updateCoins();
        saveGame();
    }
}, 1000);

// --- УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ ---
shopBtn.addEventListener('click', () => {
    shopModal.style.display = 'block';
    renderShop();
});

closeShop.addEventListener('click', () => {
    shopModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === shopModal) {
        shopModal.style.display = 'none';
    }
});

// --- КНОПКА СБРОСА В ТЕЛЕГРАМ ---
tg.MainButton.setText("Сбросить");
tg.MainButton.onClick(function() {
    if (confirm("Обнулить весь прогресс?")) {
        localStorage.clear();
        coins = 0;
        clickPower = 1;
        Object.keys(ownedUpgrades).forEach(key => delete ownedUpgrades[key]);
        updateCoins();
        updateAutoIncome();
        renderShop();
        tg.MainButton.hide();
    }
});

// --- СТАРТ ИГРЫ ---
updateCoins();
updateAutoIncome();
renderShop(); // Рисуем магазин сразу, чтобы кнопки "✓" отображались корректно
