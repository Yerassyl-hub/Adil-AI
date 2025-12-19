# 🚀 Быстрый старт AdilAI

## ✅ Шаг 1: Установка зависимостей

Зависимости уже установлены! Если нужно переустановить:

```bash
npm install --legacy-peer-deps
```

## ✅ Шаг 2: Настройка окружения

Создайте файл `.env`:

```bash
copy .env.example .env
```

Откройте `.env` и настройте (опционально):
```
API_URL=http://127.0.0.1:8000
API_KEY=superdev123
TENANT_ID=default
NOTIFICATIONS_ENABLED=true
```

## ✅ Шаг 3: Добавление ресурсов (опционально)

Поместите файлы из Figma в папку `app/assets/`:
- `icon.png` (1024x1024)
- `splash.png` (1242x2436) 
- `adaptive-icon.png` (1024x1024)
- `favicon.png` (48x48)
- `notification-icon.png` (96x96)

**Примечание:** Приложение запустится и без этих файлов, но будут предупреждения.

## 🎯 Шаг 4: Запуск приложения

### Вариант 1: Запуск через терминал

```bash
npx expo start
```

### Вариант 2: Запуск с очисткой кэша (если есть проблемы)

```bash
npx expo start --clear
```

## 📱 Шаг 5: Выбор платформы

После запуска в терминале появится меню:

- **`a`** - Запустить на Android (нужен эмулятор или устройство)
- **`i`** - Запустить на iOS (нужен Mac с Xcode)
- **`w`** - Запустить веб-версию в браузере
- **QR-код** - Отсканируйте приложением Expo Go на телефоне

## 🔧 Решение проблем

### Ошибка с package.json в родительских директориях

Если видите ошибку `SyntaxError: Unexpected token`, это уже исправлено патчем в `node_modules/find-yarn-workspace-root/index.js`.

Если ошибка повторяется после `npm install`, нужно применить патч снова:
1. Откройте `node_modules/find-yarn-workspace-root/index.js`
2. Найдите функцию `readPackageJSON`
3. Оберните `JSON.parse` в `try-catch`:

```javascript
function readPackageJSON(dir) {
  const file = path.join(dir, 'package.json');
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      return null; // Игнорируем ошибки парсинга
    }
  }
  return null;
}
```

### Ошибка "Unable to resolve asset"

Это нормально, если вы еще не добавили файлы из Figma. Приложение будет работать, просто без иконок.

### Сервер не запускается

1. Убедитесь, что порт 8081 свободен
2. Попробуйте: `npx expo start --clear`
3. Проверьте, что все зависимости установлены: `npm install --legacy-peer-deps`

## 📋 Полезные команды

```bash
# Запуск
npx expo start

# Запуск с очисткой кэша
npx expo start --clear

# Запуск на Android
npx expo start --android

# Запуск на iOS
npx expo start --ios

# Запуск веб-версии
npx expo start --web

# Линтинг
npm run lint

# Форматирование кода
npm run format

# Тесты
npm test
```

## 🎉 Готово!

После запуска вы увидите:
- QR-код для подключения
- Меню с опциями
- Логи приложения

Приложение готово к разработке! 🚀



