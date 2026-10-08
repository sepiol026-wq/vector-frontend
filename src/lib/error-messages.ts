type ErrorEntry = { title: string; desc: string };
type ErrorMessagesMap = Record<number, { ru: ErrorEntry; en: ErrorEntry }>;

export const errorMessages: ErrorMessagesMap = {
  400: {
    ru: { title: "Неверный запрос", desc: "Сервер не может обработать этот запрос. Проверь синтаксис и попробуй снова." },
    en: { title: "Bad Request", desc: "The server cannot process this request. Check the syntax and try again." },
  },
  401: {
    ru: { title: "Требуется авторизация", desc: "Войди через Telegram чтобы получить доступ к этой странице." },
    en: { title: "Unauthorized", desc: "Sign in with Telegram to access this page." },
  },
  402: {
    ru: { title: "Требуется оплата", desc: "Для доступа к этому ресурсу необходима оплата." },
    en: { title: "Payment Required", desc: "Payment is required to access this resource." },
  },
  403: {
    ru: { title: "Доступ запрещён", desc: "У тебя нет прав для просмотра этой страницы. Если считаешь что это ошибка — свяжись с администратором." },
    en: { title: "Forbidden", desc: "You don't have permission to view this page. Contact the admin if you think this is a mistake." },
  },
  404: {
    ru: { title: "Страница не найдена", desc: "То что ты ищешь не существует или было удалено. Проверь ссылку или вернись на главную." },
    en: { title: "Page Not Found", desc: "What you're looking for doesn't exist or was removed. Check the URL or go back home." },
  },
  405: {
    ru: { title: "Метод не разрешён", desc: "Этот HTTP-метод не поддерживается для данного адреса." },
    en: { title: "Method Not Allowed", desc: "This HTTP method is not allowed for this endpoint." },
  },
  408: {
    ru: { title: "Таймаут запроса", desc: "Сервер не дождался ответа. Проверь соединение и попробуй ещё раз." },
    en: { title: "Request Timeout", desc: "The server timed out waiting for the request. Check your connection and try again." },
  },
  409: {
    ru: { title: "Конфликт", desc: "Запрос конфликтует с текущим состоянием ресурса. Возможно данные уже изменились." },
    en: { title: "Conflict", desc: "The request conflicts with the current state of the resource. The data may have changed." },
  },
  410: {
    ru: { title: "Удалено", desc: "Запрашиваемый ресурс был удалён навсегда и больше недоступен." },
    en: { title: "Gone", desc: "The requested resource has been permanently removed and is no longer available." },
  },
  429: {
    ru: { title: "Слишком много запросов", desc: "Ты делаешь запросы слишком часто. Подожди немного и попробуй снова." },
    en: { title: "Too Many Requests", desc: "You're sending requests too fast. Wait a moment and try again." },
  },
  500: {
    ru: { title: "Внутренняя ошибка сервера", desc: "Что-то пошло не так на нашей стороне. Мы уже знаем о проблеме и чиним." },
    en: { title: "Internal Server Error", desc: "Something went wrong on our end. We've been notified and are fixing it." },
  },
  501: {
    ru: { title: "Не реализовано", desc: "Сервер не поддерживает этот функционал. Возможно в будущем он появится." },
    en: { title: "Not Implemented", desc: "The server does not support this functionality. It may be added in the future." },
  },
  502: {
    ru: { title: "Плохой шлюз", desc: "Промежуточный сервер получил некорректный ответ. Попробуй обновить страницу через пару секунд." },
    en: { title: "Bad Gateway", desc: "The upstream server returned an invalid response. Try refreshing in a few seconds." },
  },
  503: {
    ru: { title: "Сервис недоступен", desc: "Сервер временно перегружен или на обслуживании. Зайди чуть позже." },
    en: { title: "Service Unavailable", desc: "The server is temporarily overloaded or under maintenance. Check back soon." },
  },
  504: {
    ru: { title: "Таймаут шлюза", desc: "Промежуточный сервер не дождался ответа. Попробуй обновить страницу." },
    en: { title: "Gateway Timeout", desc: "The upstream server didn't respond in time. Try refreshing the page." },
  },
};

const fallback: { ru: ErrorEntry; en: ErrorEntry } = {
  ru: { title: "Произошла ошибка", desc: "Что-то пошло не так. Попробуй обновить страницу или вернуться на главную." },
  en: { title: "An Error Occurred", desc: "Something went wrong. Try refreshing the page or go back home." },
};

export function getErrorMessage(code: number): { ru: ErrorEntry; en: ErrorEntry } {
  return errorMessages[code] ?? fallback;
}
