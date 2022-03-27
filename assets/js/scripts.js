import Alpine from 'alpinejs'
import AlpineI18n from 'alpinejs-i18n'
Window._ = require('lodash')

window.Alpine = Alpine

Alpine.plugin(AlpineI18n)

Alpine.data('app', () => ({
    defaultLang: 'en',
    availableLangs: [
        'en', // English
        'de', // German
        'fr', // French
        'it', // Italian
        'ko', // Korean
        'es', // Spanish
        'zh-cn', // Simplified Chinese
        'zh-tw', // Traditional Chinese
        'ru', // Russian
        'th', // Thai
        'jp', // Japanese
        'pl', // Polish
        'pt', // Portuguese
        'es-419', // Spanish - Latin America
    ],
    loading: true,
    gamedata: null,
    currentList: function () {
        var list;

        if (this.gamedata != null) {
            list = this.recombine(this.gamedata.weapons);

            
            // list = Window._.filter(list, function(w) {
            // //   return w.type == 1;
            //   return true;
            // });
  

            
            // list = Window._.uniqWith(list, function (first, second) {
            //   return first.type + '.' + first.moveset_cat == second.type + '.' + second.moveset_cat;
            // });
            // list = Window._.sortBy(list, ['type']);
        }

        return list;
    },
    recombine(data) {
        for(var key in data.data) {
            data.data[key] = Window._.zipObject(data.fields, data.data[key]);
        }

        return data.data;
    },
    loadLanguage(lang) {
        fetch('/json/lang_' + lang + '.json')
            .then(res => {
                return res.status == 200 ? res.json() : null;
            })
            .then(data => {
                var newData = {};
                newData[lang] = data;

                window.AlpineI18n.create(lang, newData);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    },
    getClosestAvailableLanguage(lang) {
        lang = lang.toLowerCase().trim();

        if (this.availableLangs.includes(lang)) {
            // Exists as-is in the available langs.
            return lang;
        }

        for(var i = 0; i < this.availableLangs.length; i++) {
            var knownLang = this.availableLangs[i];

            if (lang.indexOf(knownLang) === 0) {
                // Found this language, but not the specific region/dialect
                return this.availableLangs[i];
            }
        }
    },
    init() {
        this.loadLanguage(this.defaultLang);
        AlpineI18n.fallbackLocale = 'en';
        
        var userLang = this.getClosestAvailableLanguage(window.navigator.userLanguage || window.navigator.language);
        // userLang = 'en';
        // console.log('user lang: ' + userLang);
        
        if (this.defaultLang != userLang) {
            this.loadLanguage(userLang);
        }
        
        AlpineI18n.locale = userLang;

        fetch('/json/gamedata.json')
            .then(res => res.json())
            .then(data => {
                this.loading = false;
                this.gamedata = data;
            });
    }
}))

Alpine.start()
