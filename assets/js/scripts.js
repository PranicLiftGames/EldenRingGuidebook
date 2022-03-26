import Alpine from 'alpinejs'
Window._ = require('lodash')

window.Alpine = Alpine

Alpine.data('app', () => ({
    loading: true,
    gamedata: null,
    currentList: function () {
        var list;

        if (this.gamedata != null) {
            list = this.recombine(this.gamedata.weapons);

            /**
            list = Window._.filter(list, function(w) {
              // return w.type == 1;
              return true;
            });
  
            /**
            list = Window._.uniqWith(list, function (first, second) {
              return first.type + '.' + first.moveset_cat == second.type + '.' + second.moveset_cat;
            });
            list = Window._.sortBy(list, ['type']);
            */
        }

        return list;
    },
    recombine(data) {
        for(var key in data.data) {
            data.data[key] = Window._.zipObject(data.fields, data.data[key]);
        }

        return data.data;
    },
    lang: {
        'title': 'Elden Ring Quick Lookup',
        'search_label': 'Search',
    },
    init() {
        fetch('/json/gamedata.json')
            .then(res => res.json())
            .then(data => {
                this.loading = false;
                this.gamedata = data;
            });
    }
}))

Alpine.start()
