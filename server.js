const express = require('express');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.json({ limit: '10mb' }));

// CORS headers for web requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'google-sheets-writer'
  });
});

// Root endpoint info
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Google Sheets Writer API',
    endpoints: {
      'POST /': 'Записать данные в Google Таблицу',
      'GET /health': 'Проверка состояния сервиса'
    },
    usage: {
      method: 'POST',
      body: {
        command: 'впиши',
        value: 'значение для записи'
      }
    }
  });
});

// Main endpoint for writing data to Google Sheets
app.post('/', async (req, res) => {
  console.log('Получен запрос:', JSON.stringify(req.body, null, 2));
  
  const { command, value } = req.body;

  // Validate input
  if (!command || !value) {
    console.error('Ошибка валидации: отсутствует команда или значение');
    return res.status(400).json({
      error: 'Ошибка: отсутствует команда или значение',
      required: {
        command: 'строка (например: "впиши")',
        value: 'строка или число для записи'
      }
    });
  }

  if (command !== 'впиши') {
    console.error('Неизвестная команда:', command);
    return res.status(400).json({
      error: 'Неизвестная команда',
      supportedCommands: ['впиши'],
      received: command
    });
  }

  try {
    console.log('Инициализация Google Auth...');
    
    // Initialize Google Auth
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      // If running on Cloud Run, this will use the default service account
      // If running locally, set GOOGLE_APPLICATION_CREDENTIALS environment variable
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Get spreadsheet ID from environment variable
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      console.error('GOOGLE_SPREADSHEET_ID не установлен в переменных окружения');
      return res.status(500).json({
        error: 'Ошибка конфигурации: ID таблицы не настроен',
        details: 'Установите переменную окружения GOOGLE_SPREADSHEET_ID'
      });
    }

    console.log('Подготовка данных для записи...');
    
    // Prepare data for insertion
    const timestamp = new Date().toISOString();
    const range = process.env.GOOGLE_SHEET_RANGE || 'Лист1!A:C';
    const resource = {
      values: [[timestamp, command, String(value)]]
    };

    console.log('Запись данных в Google Таблицу...', {
      spreadsheetId: spreadsheetId.substring(0, 10) + '...',
      range,
      data: resource.values[0]
    });

    // Append data to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource
    });

    console.log('Данные успешно записаны:', {
      updatedRange: response.data.updates.updatedRange,
      updatedRows: response.data.updates.updatedRows,
      updatedColumns: response.data.updates.updatedColumns,
      updatedCells: response.data.updates.updatedCells
    });

    res.status(200).json({
      success: true,
      message: '✅ Данные записаны в таблицу',
      data: {
        timestamp,
        command,
        value,
        updatedRange: response.data.updates.updatedRange,
        updatedCells: response.data.updates.updatedCells
      }
    });

  } catch (error) {
    console.error('Ошибка при записи в Google Таблицу:', error);
    
    // Enhanced error handling
    let errorMessage = 'Ошибка при записи в Google Таблицу';
    let statusCode = 500;
    
    if (error.code === 403) {
      errorMessage = 'Ошибка доступа: проверьте права сервисного аккаунта';
      statusCode = 403;
    } else if (error.code === 404) {
      errorMessage = 'Таблица не найдена: проверьте GOOGLE_SPREADSHEET_ID';
      statusCode = 404;
    } else if (error.message && error.message.includes('Unable to detect a Project Id')) {
      errorMessage = 'Ошибка аутентификации: не настроен сервисный аккаунт';
      statusCode = 401;
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Необработанная ошибка:', error);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    timestamp: new Date().toISOString()
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    path: req.path,
    method: req.method
  });
});

// Start server
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Сервер запущен на http://${HOST}:${PORT}`);
  console.log(`📊 Google Spreadsheet ID: ${process.env.GOOGLE_SPREADSHEET_ID ? process.env.GOOGLE_SPREADSHEET_ID.substring(0, 10) + '...' : 'НЕ УСТАНОВЛЕН'}`);
  console.log(`📋 Диапазон листа: ${process.env.GOOGLE_SHEET_RANGE || 'Лист1!A:C'}`);
  console.log(`🔧 Режим: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM получен, завершение работы...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT получен, завершение работы...');
  process.exit(0);
});
