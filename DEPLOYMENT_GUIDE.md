# Руководство по развертыванию на Google Cloud Run

## Быстрый старт

### 1. Настройка Google Cloud

```bash
# Войти в Google Cloud
gcloud auth login

# Установить проект
gcloud config set project YOUR_PROJECT_ID

# Включить необходимые API
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sheets.googleapis.com
```

### 2. Создание сервисного аккаунта

```bash
# Создать сервисный аккаунт
gcloud iam service-accounts create sheets-writer \
    --display-name="Google Sheets Writer"

# Получить email сервисного аккаунта
export SERVICE_ACCOUNT_EMAIL="sheets-writer@YOUR_PROJECT_ID.iam.gserviceaccount.com"

# Дать права на Google Sheets API
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/editor"
```

### 3. Настройка Google Таблицы

1. Создайте Google Таблицу
2. Скопируйте ID таблицы из URL (между `/d/` и `/edit`)
3. Поделитесь таблицей с вашим сервисным аккаунтом:
   - Нажмите "Поделиться"
   - Вставьте email: `sheets-writer@YOUR_PROJECT_ID.iam.gserviceaccount.com`
   - Дайте права "Редактор"

### 4. Развертывание

#### Вариант А: Через Cloud Build (рекомендуется)

```bash
# Клонировать/загрузить проект
cd google-sheets-writer

# Настроить переменные
export GOOGLE_SPREADSHEET_ID="your_spreadsheet_id_here"
export PROJECT_ID="your_project_id"

# Запустить Cloud Build
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_GOOGLE_SPREADSHEET_ID=$GOOGLE_SPREADSHEET_ID
```

#### Вариант Б: Ручное развертывание

```bash
# Собрать Docker образ
docker build -t gcr.io/YOUR_PROJECT_ID/sheets-writer .

# Загрузить в Container Registry
docker push gcr.io/YOUR_PROJECT_ID/sheets-writer

# Развернуть на Cloud Run
gcloud run deploy sheets-writer \
    --image gcr.io/YOUR_PROJECT_ID/sheets-writer \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars GOOGLE_SPREADSHEET_ID="YOUR_SPREADSHEET_ID" \
    --service-account sheets-writer@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 5. Тестирование

После развертывания получите URL сервиса:

```bash
gcloud run services describe sheets-writer --region us-central1 --format 'value(status.url)'
```

Протестируйте API:

```bash
curl -X POST https://YOUR_SERVICE_URL \
  -H "Content-Type: application/json" \
  -d '{"command": "впиши", "value": "Тестовое сообщение"}'
```

### 6. Проверка работы

1. Откройте вашу Google Таблицу
2. В листе "Лист1" должна появиться новая строка с:
   - Временная метка
   - Команда "впиши"
   - Значение "Тестовое сообщение"

## Настройка переменных окружения

Скопируйте `.env.example` в `.env` и настройте:

```bash
GOOGLE_SPREADSHEET_ID=your_actual_spreadsheet_id_here
GOOGLE_SHEET_RANGE=Лист1!A:C
PORT=8080
HOST=0.0.0.0
NODE_ENV=production
```

## Структура API

### POST /
Записать данные в таблицу

**Запрос:**
```json
{
  "command": "впиши",
  "value": "Ваш текст для записи"
}
```

**Ответ (успех):**
```json
{
  "success": true,
  "message": "✅ Данные записаны в таблицу",
  "data": {
    "timestamp": "2025-06-26T10:30:00.000Z",
    "command": "впиши",
    "value": "Ваш текст для записи",
    "updatedRange": "Лист1!A2:C2",
    "updatedCells": 3
  }
}
```

### GET /health
Проверка состояния сервиса

**Ответ:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-26T10:30:00.000Z",
  "service": "google-sheets-writer"
}
```

## Решение проблем

### Ошибка 403 (Forbidden)
- Проверьте права сервисного аккаунта
- Убедитесь, что таблица расшарена с сервисным аккаунтом

### Ошибка 404 (Not Found)
- Проверьте правильность GOOGLE_SPREADSHEET_ID
- Убедитесь, что таблица существует

### Ошибка аутентификации
- Проверьте настройки IAM
- Убедитесь, что сервисный аккаунт привязан к Cloud Run

## Мониторинг

Просмотр логов:
```bash
gcloud logs tail projects/YOUR_PROJECT_ID/logs/run.googleapis.com%2Frequests
```

Просмотр метрик в Cloud Console:
https://console.cloud.google.com/run/detail/us-central1/sheets-writer