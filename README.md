Домашнее задание №2
===
Разделение приватного ключа secp256k1 по схеме Шамира

Запуск программы
---

Сначала клонируем репозиторий
```bash
# Clone git repo
git clone https://github.com/Ionnia/CryptoHW3
```

В папке проекта запускаем `npm install`, чтобы скачать все необходимые зависимости

После этого запускаем программу с помощью команды:
```bash
npm start %mode%
```

Где %mode% - это режим работы программы: split - для разделения приватного ключа, recover - для восстановления и
test - для тестового режима, в котором автоматически генерируется приватный ключ, разделяется, а потом восстанавливается.