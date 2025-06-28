# Google Sheets Writer API

Node.js приложение с Express для записи данных в Google Таблицы через API, развертываемое на Google Cloud Run.

## Функциональность

- HTTP POST эндпоинт принимает JSON с командой "впиши" и значением
- Подключение к Google Таблице через Google Sheets API
- Запись данных (дата, команда, значение) в новую строку листа
- Возврат подтверждения успешной записи
- Аутентификация через сервисный аккаунт Google
- Готовность к развертыванию на Google Cloud Run

## Установка и настройка

### 1. Предварительные требования

- Node.js 18+
- Google Cloud SDK
- Доступ к Google Cloud Console
- Google Таблица для записи данных

### 2. Настройка Google Cloud

#### Создание сервисного аккаунта:
```bash
# Создать сервисный аккаунт
gcloud iam service-accounts create sheets-writer \
    --display-name="Google Sheets Writer"

# Скачать ключ сервисного аккаунта (для локальной разработки)
gcloud iam service-accounts keys create service-account-key.json \
    --iam-account=sheets-writer@YOUR_PROJECT_ID.iam.gserviceaccount.com
