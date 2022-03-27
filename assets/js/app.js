import Alpine from 'alpinejs'
import AlpineI18n from './_i18n'
import AlpinePersist from '@alpinejs/persist'
import Fuzzysort from 'fuzzysort'
Window._ = require('lodash')
window.Alpine = Alpine

Alpine.plugin(AlpinePersist)
Alpine.plugin(AlpineI18n)

// TODO: Rewrite this logic.
// These parts of the library some strings of language loaded for searching.
var searchKeysToCombine = {
    weapons: ['name'],
}

Alpine.data('app', function () {
    return {
        // We keep data loaded via JSON here, to re-combine with language data if needed
        rawData: null,                      

        // The current search term.  Model-bound to the input.
        searchTerm: '',                     

        // The default language
        defaultLang: 'en',     

        // The user-selected language.  Model-bound to the component.
        lang: this.$persist('en'),  

        // These languages will be available to the user.
        availableLangs: {
            'en': 'English', // English
            'jp': '日本語', // Japanese
            'zh-cn': '中文（简体）', // Simplified Chinese
            'zh-tw': '中文', // Traditional Chinese
            'fr': 'français', // French
            'de': 'Deutsch', // German
            'it': 'italiano', // Italian
            'pl': 'polski', // Polish
            'pt': 'português', // Portuguese
            'ko': '한국어', // Korean
            'ru': 'русский', // Russian
            'es': 'español', // Spanish
            'es-419': 'español de América Latina', // Spanish - Latin America
            'th': 'ไทย', // Thai
        },
        
        // Are we currently loading anything?
        loading: false,
        
        // Where we store all of the broad-brush game data.  Any reference data, basically, labeled with the user's language
        gamedata: null,

        // A computed property which is the dynamic search-term list.
        get loadedList() {
            // TODO: Rewrite this to account for more than just weapons.
            if (this.gamedata && this.gamedata.weapons) {
                if (this.searchTerm) {
                    var results = Window._.map(Fuzzysort.go(this.searchTerm, this.loadSearchEngine(), {key: 'name'}), function (result) {
                        return result.obj;
                    });

                    return Window._.intersectionBy(this.gamedata.weapons, results, 'id');
                }

                return this.gamedata.weapons;
            }

            return [];
        },

        // JSON files arrive with column headers separated.  Stitch them all back together.
        stitchAll(data) {
            for(var key in data) {
                data[key] = this.stitch(data[key]);

                if (typeof searchKeysToCombine[key] != 'undefined') {
                    for (var i = 0; i < searchKeysToCombine[key].length; i++) {
                        var keyToAdd = searchKeysToCombine[key][i];
                        
                        for(var id in data[key]) {
                            data[key][id][keyToAdd] = window.AlpineI18n.t(key + '.' + data[key][id]['id'] + '.' + keyToAdd);
                        }
                    }
                }
            }

            return data;
        },

        // Stitches one of the gamedata's library of records together.
        stitch(data) {
            if(typeof data.fields == 'undefined') {
                // There's no fields record, so this must not need stitching.
                return data;
            }

            // TODO: throw / catch some kind of exception, maybe, if the data isn't in the right format

            for(var key in data.data) {
                // Zip/stitch together each record's values using the `fields` attribute as headers.
                // Index-based zipping.
                data.data[key] = Window._.zipObject(data.fields, data.data[key]);
            }

            return data.data;
        },

        // Based on a given code, returns the local code of the closest language we have.
        getClosestAvailableLanguage(lang) {
            // Make all of our comparisons case-insensitive.
            lang = lang.toLowerCase().trim();

            // Make an array of our available languages to check against.
            var langCodes = Window._.keys(this.availableLangs);

            if (langCodes.includes(lang)) {
                // The request exists exactly as-is in the available languages.
                return lang;
            }

            // We didn't find an exact match, so we'll do a "startsWith" comparison
            for(var i = 0; i < langCodes.length; i++) {
                var knownLang = langCodes[i];

                if (lang.indexOf(knownLang) === 0) {
                    // We found part of the requested lang's string in a known lang.
                    // i.e. "fr-ca" matches "fr"
                    // So we found this language, but not the specific region/dialect.
                    // It'll have to do.
                    return langCodes[i];
                }
            }
        },

        // "Engine" is a strong word.  More like it transforms the data and language strings
        //   which are provided to the fuzzy searcher.
        //
        // TODO: Re-write this so I can be sure the "search engine" isn't re-transforming every time and chewing throw processing.
        loadSearchEngine() {
            var library = Window._.map(this.gamedata.weapons, function (weapon) {
                return {
                    'type': 'weapon',
                    'id': weapon.id,
                    'name': weapon.name,
                };
            });

            return library;
        },

        // The user switched the language, so load it and rebuild the search index.
        refreshLang() {
            
            if (window.AlpineI18n.has(this.lang)) {
                // Language already loaded; just switch to it
                window.AlpineI18n.locale = this.lang;
                this.gamedata = this.stitchAll(JSON.parse(JSON.stringify(this.rawData)));
            } else {
                var lang = this.lang;
                var that = this;

                // Load the language file via AJAX.
                this.loadLanguage(lang, function () {
                    // Turn on the selected language
                    window.AlpineI18n.locale = lang;

                    // Stitch the gamedata together
                    that.gamedata = that.stitchAll(that.rawData);
                })
            }
        },

        // Load a single language via JSON.
        loadLanguage(lang, fn) {

            // First, check if we've already loaded this language
            if (window.AlpineI18n.has(lang)) {
                // Prevent another AJAX request from firing
                if (typeof fn == 'function') {
                    fn(window.AlpineI18n.messages[lang]);
                }
                return;
            }

            // We are now loading
            this.loading = true;

            fetch('/json/lang_' + lang + '.json')
                .then(res => {
                    // JSON file loaded.  Pass the object on.
                    return res.status == 200 || res.status == 304 ? res.json() : null;
                })
                .then(data => {
                    // Add the JSON contents to i18n under the given code
                    window.AlpineI18n.add(lang, data);
                })
                // Keep the callback going
                .then(fn)

                .finally(() => {
                    // Turn off the loading, once everything is complete.
                    this.loading = false;
                })
                .catch((error) => {
                    // TODO: fail more gracefully.
                    console.error('Error:', error);
                });
        },

        // Load the default language and the user-requested language (if different).
        loadLanguages(fn) {
            var that = this;
            
            // First, load the default language
            this.loadLanguage(this.defaultLang, function () {
                
                // Determine if the user has a site preference, and if not then if they have a browser language preference.
                var userLang = that.getClosestAvailableLanguage(that.lang || window.navigator.userLanguage || window.navigator.language);
                
                // Make a call to the loader for the user preference.  It will be ignored if it is already loaded.
                that.loadLanguage(userLang, (data) => {
                    // CODE SMELL BUT THIS JUST ATE UP TWO HOURS
                    // For some reason, we have to set this here...
                    window.AlpineI18n.fallbackLocale = that.defaultLang;

                    // Set the current messages locale to the user's selection
                    window.AlpineI18n.locale = userLang;

                    // Trigger the callback.
                    fn();
                });
            });
        },

        // Load the library of game data.
        loadGameData(fn) {
            fetch('/json/gamedata.json')
                // JSON file loaded.  Pass the object on.
                .then(res => res.json())

                .then(data => {
                    // Loading complete.
                    this.loading = false;
                    
                    // Keep the raw data around.
                    this.rawData = data;

                    // Instead of flat arrays, turn the records into objects
                    this.gamedata = this.stitchAll(data);

                    // Trigger the callback.
                    fn();
                });
        },
        init() {
            // Load languages, then gamedata, then we're done loading.
            this.loadLanguages(() => this.loadGameData(() => this.loading = false ));
        }
    }
});

Alpine.store('darkMode', {
    on: Alpine.$persist(true).as('darkMode_on')
});

Alpine.start();
