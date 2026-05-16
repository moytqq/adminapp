# adminapp — Admin Dashboard (Next.js Frontend)

## Стек
- Next.js 15 (App Router), React 19, TypeScript
- Redux Toolkit — глобальное состояние
- Axios — HTTP-клиент (с интерцепторами авторизации)
- SCSS Modules — стили
- lucide-react — иконки
- date-fns — форматирование дат

## Переменные окружения
```
NEXT_PUBLIC_ROUNDCUBE_URL   # URL Roundcube webmail (для iframe и CSP)
NEXT_PUBLIC_FILES_URL       # URL fileserver (для аватаров и вложений чата)
ROUNDCUBE_SSO_SECRET        # Секрет для подписи SSO (только серверная сторона)
```

## API
Базовый URL бекенда: задан в `src/services/api.ts` через переменную окружения или proxy.
Все запросы идут через `api` (axios instance) — он добавляет куку `auth_token` автоматически.

## Структура `src/`

```
app/                        # Next.js страницы (App Router)
  login/                    # Страница входа
  main/                     # Дерево иерархии (главная)
  profile/                  # Личный кабинет (вкладки)
  services/                 # Управление сервисами
  autoOrders/               # Автозаказы и остатки
  results/                  # Отчёты
  planner/                  # Планировщик
  proposes/                 # Предложения (доступно всем авторизованным)
  mail/                     # Почта (iframe Roundcube)
  staff/                    # Управление персоналом
  api/
    mail-auth/              # SSO для Roundcube
    rc/[[...path]]/         # Прокси Roundcube

components/
  AuthInitializer/          # Инициализация авторизации при старте
  SideMenu/                 # Боковое меню навигации
  ProtectedRoute/           # HOC проверки авторизации и флагов
  TreeList/                 # Дерево иерархии организации
  UserAvatar/               # Аватар пользователя (с fallback на инициалы)
  Profile/
    Personal/               # Личные данные + загрузка фото профиля
    Chat/
      ChatList.tsx          # Список чатов (с аватарами собеседников)
      ChatMessages.tsx      # Сообщения чата (с поддержкой вложений-изображений)
      ChatView.tsx          # Контейнер чата
      CreateChatModal.tsx   # Создание нового чата
    Departments/            # Отделы пользователя
    EmployeesView/          # Список сотрудников
  Services/
    ServiceTypeSelector.tsx # Выбор типа сервиса (статический список, 8 типов)
    ServiceRegistration.tsx # Форма регистрации сервисного обращения
  AutoOrders/
    RemaindersView.tsx      # Инвентаризация (использует packaging, не packaging_supplier!)
    RemainderFormSelector.tsx
  Proposes/
    Proposes.tsx            # Форма предложений (все) + список для ADMIN/TECH_SUPPORT

services/                   # API-клиенты
  api.ts                    # Axios instance, флаги доступа, интерцепторы
  chatApi.ts                # Чат + загрузка файлов-вложений
  profileApi.ts             # Профиль + загрузка аватара
  remaindersApi.ts          # Остатки/инвентаризация
  proposesApi.ts            # Предложения

store/
  store.ts
  slices/
    authSlice.ts            # Авторизация (token, flags, hid)
    treeSlice.ts            # Дерево иерархии
    personalSlice.ts
    addressSlice.ts
  hooks/
    useAccess.ts            # Проверка флагов доступа для меню
  thunks/                   # Async thunks

utils/
  crypto.ts                 # hashPasswordWithSalt (SHA256 + соль)
```

## Авторизация и флаги
Токен хранится в куке `auth_token`. Флаги роли пользователя:

| Флаг | Доступ |
|------|--------|
| `ADMIN` | Полный доступ, просмотр предложений |
| `TECH_SUPPORT` | Просмотр предложений |
| `SERVICE` | Сервисные обращения |
| `SERVICE_ADMIN` | Администрирование сервисов |
| `LS_AUTOZAKAZI` | Автозаказы / остатки |
| `RESULTS` | Отчёты |
| `CHAT` | Чат |
| `HIERARCHY` | Дерево иерархии |
| `LS_{hid}` | Линейный персонал, привязка к отделу |

## Ключевые паттерны

### Вложения в чате
Хранятся прямо в тексте сообщения как XML-тег:
```
<attachment id="uuid.jpg" name="photo.jpg" />
```
Парсинг: `parseMessage()` в `ChatMessages.tsx`. Загрузка через `chatApi.uploadFile()`.

### Аватары
URL: `${NEXT_PUBLIC_FILES_URL}/files/avatar_{hid}.jpg`
Компонент `UserAvatar` — пробует загрузить, при ошибке показывает инициалы.
Загрузка через `profileApi.uploadAvatar()` → `POST /files/upload-avatar`.

### Типы сервисов
Статический массив в `ServiceTypeSelector.tsx`, экспортирует `typeConfigMap` (Map).
8 типов: repairs, coffeeMakers, fridges, shopWindows, kitchen, stove, climate, cashRegisters.

### Инвентаризация
`RemaindersView.tsx` — использует поле `packaging` (наша фасовка), НЕ `packaging_supplier`.
