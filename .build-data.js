var _ = require('lodash');
var fs = require('fs');

function compressGameDataForDelivery() {
    var data = JSON.parse(fs.readFileSync(__dirname + '/assets/json/gamedata.json'));
    var fields;

    for(var key in data.weapons) {
        if(! fields) {
            fields = _.keys(data.weapons[key]);
        }

        data.weapons[key] = _.values(data.weapons[key]);
    }

    data.weapons = {
        'fields': fields,
        'data': data.weapons,
    };

    // Move the new file into the public folder
    fs.writeFileSync('./_site/json/gamedata.json', JSON.stringify(data));
}

compressGameDataForDelivery();