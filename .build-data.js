var _ = require('lodash');
var fs = require('fs');
var langs = [
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
];

function compressGameDataForDelivery() {
    var data = JSON.parse(fs.readFileSync(__dirname + '/assets/json/gamedata.json'));
    var fields;

    for (var key in data.weapons) {
        if (!fields) {
            fields = _.keys(data.weapons[key]);
        }

        data.weapons[key] = _.values(data.weapons[key]);
    }

    data.weapons = {
        'fields': fields,
        'data': data.weapons,
    };

    // Put the final data file in the public folder
    fs.writeFileSync('./_site/json/gamedata.json', JSON.stringify(data));
}


function makeLanguageFile(lang) {
    var gamedata = JSON.parse(fs.readFileSync(__dirname + '/assets/json/gamedata.json'));
    var data = JSON.parse(fs.readFileSync(__dirname + '/assets/json/lang_' + lang + '.json'));

    var r = {
        weapons: _.mapValues(_.invert(Object.keys(gamedata.weapons)), (value, key) => {
            return {
                'name': data['weaponNames'][key],
                'description': data['weaponCaptions'][key]
            };
        })
    };

    // Put the new file in the public folder
    fs.writeFileSync('./_site/json/lang_' + lang + '.json', JSON.stringify(r));
}


// Compress the large JSON file into smol JSON file
compressGameDataForDelivery();

// Re-make all of the necessary language files, stripping out duplicated content
langs.forEach(makeLanguageFile);

