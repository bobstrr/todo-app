# Todo App — Docker Compose Project

Прост Todo уеб приложение с три услуги, контейнеризирани с Docker Compose.

## Структура на проекта

```
todo-app/
├── compose.yml          # Docker Compose конфигурация
├── backend/
│   ├── Dockerfile       # Docker образ за бекенда
│   ├── index.js         # Express API сървър
│   └── package.json
└── frontend/
    ├── Dockerfile       # Docker образ за фронтенда
    ├── index.html       # Едностранично приложение
    └── nginx.conf       # Nginx конфигурация
```

## Компоненти

### 1. Frontend (nginx)
- Статичен HTML/CSS/JS файл, сервиран от **nginx:alpine**
- Nginx действа и като **reverse proxy** — всички заявки към `/api/*` се препращат към бекенда
- Порт: **80**

### 2. Backend (Node.js + Express)
- REST API с четири крайни точки (CRUD за задачи)
- Свързва се с PostgreSQL чрез библиотеката `pg`
- При стартиране изчаква базата данни и автоматично създава таблицата `todos`
- Порт: **3000**

### 3. Database (PostgreSQL 16)
- Официален `postgres:16-alpine` образ
- Данните се пазят в именуван Docker volume (`db_data`), така че не се губят при рестартиране
- Healthcheck гарантира, че бекендът стартира само след като БД е готова

## Комуникация между услугите

```
Браузър
   │  HTTP :80
   ▼
Frontend (nginx)
   │  /api/* → proxy_pass http://backend:3000/
   ▼
Backend (Node.js)
   │  pg клиент → host: db, port: 5432
   ▼
Database (PostgreSQL)
```

Всички услуги са в обща Docker мрежа, създадена автоматично от Compose. Услугите комуникират помежду си по **имена** (db, backend, frontend) — не по IP адреси.

## Как се изграждат и стартират контейнерите

### Изисквания
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (включва Compose)

### Стартиране (от root директорията на проекта)

```bash
# Изгради образите и стартирай всичко
docker compose up --build

# Или в background режим
docker compose up --build -d
```

Приложението е достъпно на: **http://localhost**

### Спиране

```bash
docker compose down
```

### Спиране и изтриване на данните

```bash
docker compose down -v
```

## Docker Hub образи

| Услуга   | Образ |
|----------|-------|
| Backend  | `YOUR_DOCKERHUB_USERNAME/todo-backend:latest` |
| Frontend | `YOUR_DOCKERHUB_USERNAME/todo-frontend:latest` |

### Публикуване на образите

```bash
# Влез в Docker Hub
docker login

# Изгради и публикувай
docker build -t YOUR_DOCKERHUB_USERNAME/todo-backend:latest ./backend
docker push YOUR_DOCKERHUB_USERNAME/todo-backend:latest

docker build -t YOUR_DOCKERHUB_USERNAME/todo-frontend:latest ./frontend
docker push YOUR_DOCKERHUB_USERNAME/todo-frontend:latest
```

## API крайни точки

| Метод  | Път          | Описание              |
|--------|--------------|-----------------------|
| GET    | /todos       | Всички задачи         |
| POST   | /todos       | Нова задача           |
| PATCH  | /todos/:id   | Смени статуса (done)  |
| DELETE | /todos/:id   | Изтрий задача         |
