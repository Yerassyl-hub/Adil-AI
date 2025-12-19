# Настройка AI Chat API

## ✅ Что уже сделано

1. `API_URL` и `API_KEY` прокидываются из `.env` через `app.config.ts` → `app/lib/api.ts`
   - дефолт: `http://127.0.0.1:8000`
   - для внешнего доступа используйте ngrok: `https://<ngrok>.ngrok-free.app`
2. HTTP-клиент `app/services/chat.ts` отправляет `POST /v1/chat` с Bearer API-ключом
3. Ответ нормализуется независимо от формата (`answer`, `reply`, `response`, `messages` с ролью `assistant`)

## 🔄 Как проверить

### 1. Запустите Expo с нужными переменными

```bash
API_URL="http://127.0.0.1:8000" API_KEY="superdev123" npx expo start
```

### 2. Отправьте сообщение в чате

В консоли Metro появятся предупреждения только если запрос упал — приложение в этом случае перейдёт на мок-ответ.

### 3. Если используете ngrok

```bash
API_URL="https://<ngrok>.ngrok-free.app" API_KEY="superdev123" npx expo start --tunnel
```

## 🧾 Формат запроса

```json
{
  "messages": [
    { "role": "system", "content": "Помогай кратко" },
    { "role": "user", "content": "Привет! Расскажи о договоре поставки." }
  ]
}
```

## 📦 Формат ответа

Допустимо любое из следующих полей:

- `answer`, `reply`, `response`, `output` — текст ответа
- `messages` — берётся последнее сообщение с `role = "assistant"`
- дополнительные данные (`law`, `checklist`, `confidence`) пробрасываются в UI без изменений

## ❗️Если что-то не работает

1. Убедитесь, что `API_URL` и `API_KEY` корректно переданы (проверьте `app/lib/api.ts`)
2. Проверьте, что FastAPI доступен и возвращает `GET /health → {"status":"ok"}`
3. Для мобильных устройств используйте HTTPS (ngrok) чтобы избежать Mixed Content
4. При ошибках сеть/авторизация чат автоматически покажет мок-ответ и лог `[Chat] Falling back to mock due to error`

