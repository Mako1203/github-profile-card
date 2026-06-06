// === DOM Elements ===
const usernameInput = document.getElementById('usernameInput');
const searchBtn = document.getElementById('searchBtn');
const loader = document.getElementById('loader');
const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');
const profileContainer = document.getElementById('profileContainer');
const reposContainer = document.getElementById('reposContainer');
const reposList = document.getElementById('reposList');

// Profile elements
const avatar = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const bio = document.getElementById('bio');
const publicRepos = document.getElementById('publicRepos');
const followers = document.getElementById('followers');
const following = document.getElementById('following');

const API_BASE = 'https://api.github.com';
const REPOS_COUNT = 5;

// ============================================
// HELPERS
// ============================================

function showLoader() {
    loader.classList.remove('hidden');
}

function hideLoader() {
    loader.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
    profileContainer.classList.add('hidden');
    reposContainer.classList.add('hidden');
    hideLoader();
}

function hideError() {
    errorContainer.classList.add('hidden');
}

// ============================================
// API ЗАПРОСЫ
// ============================================

// Отдельный запрос к GitHub API для получения данных пользователя
async function fetchUser(username) {
    const response = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}`);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Пользователь не найден');
        } else if (response.status === 403) {
            throw new Error('Превышен лимит запросов. Попробуйте позже');
        } else {
            throw new Error('Ошибка сети');
        }
    }

    return response.json();
}

// Отдельный запрос к GitHub API для получения репозиториев пользователя
async function fetchRepos(username) {
    const response = await fetch(
        `${API_BASE}/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=${REPOS_COUNT}&type=owner`
    );

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('Превышен лимит запросов. Попробуйте позже');
        }
        throw new Error('Ошибка сети');
    }

    return response.json();
}

// ============================================
// ОТОБРАЖЕНИЕ ДАННЫХ
// ============================================

function renderProfile(user) {
    // Аватар
    avatar.src = user.avatar_url;
    avatar.alt = `Аватар ${user.login}`;
    avatar.style.display = 'inline-block';

    // Имя (если нет имени — показываем логин)
    nameEl.textContent = user.name || user.login;

    // Биография — скрываем через CSS :empty если нет
    bio.textContent = user.bio || '';

    // Статистика
    publicRepos.textContent = user.public_repos;
    followers.textContent = user.followers;
    following.textContent = user.following;

    profileContainer.classList.remove('hidden');
}

function renderRepos(repos) {
    reposList.innerHTML = '';

    // Отображаем последние 5 репозиториев с названием и описанием
    repos.forEach(repo => {
        const item = document.createElement('div');
        item.className = 'repo-item';

        const link = document.createElement('a');
        link.href = repo.html_url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = repo.name;

        const description = document.createElement('p');
        description.className = 'repo-description';
        description.textContent = repo.description || 'Нет описания';

        item.appendChild(link);
        item.appendChild(description);
        reposList.appendChild(item);
    });

    reposContainer.classList.remove('hidden');
}

// ============================================
// ОСНОВНАЯ ФУНКЦИЯ ПОИСКА
// ============================================

async function searchProfile(username) {
    // Скрываем предыдущие результаты и ошибки
    hideError();
    profileContainer.classList.add('hidden');
    reposContainer.classList.add('hidden');
    hideLoader();

    const trimmed = username.trim();

    if (!trimmed) {
        showError('Введите имя пользователя');
        usernameInput.focus();
        return;
    }

    // Показываем индикатор загрузки
    searchBtn.disabled = true;
    searchBtn.textContent = 'Поиск...';
    showLoader();

    try {
        // Выполняем оба запроса параллельно
        const [user, repos] = await Promise.all([
            fetchUser(trimmed),
            fetchRepos(trimmed),
        ]);

        // Скрываем индикатор после завершения
        hideLoader();

        renderProfile(user);
        renderRepos(repos);
    } catch (error) {
        // Если fetch упал из-за отсутствия интернета
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            showError('Ошибка сети. Проверьте подключение к интернету');
        } else {
            showError(error.message);
        }
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Поиск';
    }
}

// ============================================
// СОБЫТИЯ
// ============================================

// Поиск по кнопке
searchBtn.addEventListener('click', () => {
    searchProfile(usernameInput.value);
});

// Поиск по Enter
usernameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchProfile(usernameInput.value);
    }
});
