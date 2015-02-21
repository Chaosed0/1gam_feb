/* Original code by drow <drow@bin.sh>
 * Modifications by Ed Lu */

define(function() {

    var NameGenerator = function(list) {
        var chain = {};

        for (var i = 0; i < list.length; i++) {
            var names = list[i].split(/\s+/);
            chain = incr_chain(chain,'parts',names.length);

            var j; for (j = 0; j < names.length; j++) {
                var name = names[j];
                chain = incr_chain(chain,'name_len',name.length);

                var c = name.substr(0,1);
                chain = incr_chain(chain,'initial',c);

                var string = name.substr(1);
                var last_c = c;

                while (string.length > 0) {
                    var c = string.substr(0,1);
                    chain = incr_chain(chain,last_c,c);

                    string = string.substr(1);
                    last_c = c;
                }
            }
        }
        this.chain = scale_chain(chain);
    }

    /* Generator function */
    NameGenerator.prototype.generateName = function() {
        var parts = select_link(this.chain,'parts');
        var names = [];

        var i; for (i = 0; i < parts; i++) {
            var name_len = select_link(this.chain,'name_len');
            var c = select_link(this.chain,'initial');
            var name = c;
            var last_c = c;

            while (name.length < name_len) {
                c = select_link(this.chain,last_c);
                name += c;
                last_c = c;
            }
            names.push(name);
        }
        return names.join(' ');
    }

    /* Generate some names */
    NameGenerator.prototype.getNames = function(num) {
        var list = new Array(num);

        for (var i = 0; i < num; i++) {
            list[i] = this.generateName(type);
        }
        return list;
    }

    /* Helper funcs for constructing chain */
    function incr_chain (chain, key, token) {
        if (chain[key]) {
            if (chain[key][token]) {
                chain[key][token]++;
            } else {
                chain[key][token] = 1;
            }
        } else {
            chain[key] = {};
            chain[key][token] = 1;
        }
        return chain;
    }
    function scale_chain (chain) {
        var table_len = {};

        var key; for (key in chain) {
            table_len[key] = 0;

            var token; for (token in chain[key]) {
                var count = chain[key][token];
                var weighted = Math.floor(Math.pow(count,1.3));

                chain[key][token] = weighted;
                table_len[key] += weighted;
            }
        }
        chain['table_len'] = table_len;
        return chain;
    }

    /* Helper func for generating name */
    function select_link (chain, key) {
        var len = chain['table_len'][key];
        var idx = Math.floor(Math.random() * len);

        var t = 0; for (token in chain[key]) {
            t += chain[key][token];
            if (idx < t) { return token; }
        }
        return '-';
    }

    return NameGenerator;
});
