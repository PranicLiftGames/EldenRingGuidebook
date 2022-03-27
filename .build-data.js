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

var labelIDs = {
    weaponTypes: {
        // the weapon category and moveset category make up the key
        // the value references where the category name exists in the language file
        
        '0-20': "menuText.60010", // "Dagger"
        '1-23': "menuText.60015", // "Straight Sword"
        '1-25': "menuText.60020", // "Greatsword"
        '1-26': "menuText.60025", // "Colossal Sword"
        '1-24': "menuText.60043", // "Twinblade"
        '1-43': "menuText.60155", // "Whip"
        '2-27': "menuText.60045", // "Thrusting Sword"
        '2-39': "menuText.60046", // "Heavy Thrusting Sword"
        '3-28': "menuText.60025", // "Curved Swords",
        '3-40': "menuText.60035", // "Curved Greatswords",
        '3-29': "menuText.60040", // "Katanas",
        '4-30': "menuText.60050", // "Axes",
        '4-32': "menuText.60055", // "Greataxes",
        '5-33': "menuText.60060", // "Hammers",
        '5-35': "menuText.60065", // "Warhammers",
        '5-32': "menuText.60065", // "Warhammers",
        '5-34': "menuText.60067", // "Flails",
        '5-31': "menuText.60102", // "Colossal Weapons",
        '6-36': "menuText.60070", // "Spears",
        '6-37': "menuText.60077", // "Great Spears",
        '7-38': "menuText.60080", // "Halberds",
        '7-50': "menuText.60085", // "Reapers",
        '8-41': "menuText.60120", // "Glintstone Staffs",
        '9-42': "menuText.60090", // "Fists",
        '9-22': "menuText.60100", // "Claws",
        '10-51': "menuText.60104", // "Light Bows",
        '10-44': "menuText.60105", // "Bows",
        '10-45': "menuText.60110", // "Greatbows",
        '11-46': "menuText.60115", // "Crossbows",
        '11-52': "menuText.60117", // "Ballistas",
        '12-21': "menuText.60175", // "Torches",
        '12-48': "menuText.60140", // "Small Shields",
        '12-49': "menuText.60145", // "Medium Shields",
        '12-47': "menuText.60150", // "Greatshields"
    },
}

function compressGameDataForDelivery() {
    var data = JSON.parse(fs.readFileSync(__dirname + '/assets/json/gamedata.json'));
    var fields;

    for(var type in data) {
        for (var key in data[type]) {
            if (!fields) {
                fields = _.keys(data[type][key]);
            }
    
            data[type][key] = _.values(data[type][key]);
        }
    
        data[type] = {
            'fields': fields,
            'data': data[type],
        };
    }


    // Put the final data file in the public folder
    fs.writeFileSync('./_site/json/gamedata.json', JSON.stringify(data));
}

function getList(data, key) {
    var labels = labelIDs[key];
    var r = {};

    for(var k in labels) {
        r[k] = _.get(data, labels[k]);
    }
    
    return r;
}

function makeLanguageFile(lang) {
    var gamedata = JSON.parse(fs.readFileSync(__dirname + '/assets/json/gamedata.json'));
    var data = JSON.parse(fs.readFileSync(__dirname + '/assets/json/lang_' + lang + '.json'));
    var appLangFile = __dirname + '/lang/' + lang + '.json';

    var r = {
        weapons: _.mapValues(_.invert(Object.keys(gamedata.weapons)), (value, key) => {
            return {
                'name': data['weaponNames'][key],
                'description': data['weaponCaptions'][key]
            };
        })
    };

    if (fs.existsSync(appLangFile)) {
        r.app = JSON.parse(fs.readFileSync(appLangFile));
    } else {
        console.error('could not find file ' + appLangFile);
    }

    r.weaponTypes = getList(data, 'weaponTypes');

    // Put the new file in the public folder
    fs.writeFileSync('./_site/json/lang_' + lang + '.json', JSON.stringify(r));
}


// Compress the large JSON file into smol JSON file
compressGameDataForDelivery();

// Re-make all of the necessary language files, stripping out duplicated content
langs.forEach(makeLanguageFile);

