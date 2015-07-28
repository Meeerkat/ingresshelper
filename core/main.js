/**
 * @file Primary bot file
 * @author Artem Veikus artem@veikus.com
 * @version 2.0
 */
var app = {};

(function() {
    var commandCancelledText, unknownCommandText,
        modules = {},
        activeModule = {};

    window.onload = init;

    /**
     * Modules initialization
     */
    function init() {
        Object.keys(app.modules).forEach(function(name) {
            var module = app.modules[name],
                magicWord = module.initMessage;

            if (magicWord) {
                modules[magicWord] = module;
            }
        });

        getUpdates();
    }

    /**
     * Receive updates from telegram
     */
    function getUpdates() {
        app.telegram.getUpdates(function(messages) {
            if (messages) {
                messages.forEach(function(message) {
                    processMessage(message);
                });

                getUpdates();
            } else {
                setTimeout(getUpdates, 5000);
            }
        });
    }

    /**
     * Process single message
     * @param message {object} Message from getUpdates
     */
    function processMessage(message) {
        var lang,
            chat = message.chat.id,
            text = message.text;

        // Hack for a new users
        if (text === '/start') {
            app.telegram.sendMessage(chat, 'Thank you for installing me. Send me location to get intel screenshot');
            text = '/language';
        }

        // If user asked for another module
        if (modules[text]) {
            activeModule[chat] = new modules[text](message);
        }

        // If user asked to cancel current action - just remove a module
        else if (text === '/cancel') {
            delete activeModule[chat];

            lang = app.settings.lang(chat);
            app.telegram.sendMessage(chat, commandCancelledText[lang] || commandCancelledText.en, null);
        }

        // If user has another active module
        else if (activeModule[chat]) {
            activeModule[chat].onMessage(message);
        }

        // In other case check is it location
        else if (message.location && app.modules.screenshot) {
            activeModule[chat] = new app.modules.screenshot(message);
        }

        // Or maybe user made a mistake (do not reply in groups)
        else if (chat > -1) {
            lang = app.settings.lang(chat);
            app.telegram.sendMessage(chat, unknownCommandText[lang] || unknownCommandText.en, null);
        }

        // Cleanup complete modules
        if (activeModule[chat] && activeModule[chat].complete) {
            delete activeModule[chat];
        }
    }

    // Translation
    unknownCommandText = {
        en: 'Unknown command',
        ru: 'Неизвестная команда',
        ua: 'Невідома команда',
        it: 'Comando sconosciuto',
        'zh-cmn-Hans': '无效指令',
        'zh-cmn-Hant': '無效指令'
    };

    commandCancelledText = {
        en: 'Ok, i cancelled previous command',
        ru: 'Окей, команда отменена',
        ua: 'Гаразд, команду скасовано',
        it: 'Ok, ho cancellato il comando precedente',
        'zh-cmn-Hans': '好的，我将取消上一条指令',
        'zh-cmn-Hant': '好的，我將取消上一條指令'
    };
}());
