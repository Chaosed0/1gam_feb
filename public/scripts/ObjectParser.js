
define(['./Util'], function(u) {

    var ObjectParser = function(strings) {
        this.map = {};
        for(var type in strings) {
            var split = {
                varToArrMap: {},
                strings: []
            }

            var str = strings[type];
            var replaceFrom = str.indexOf('{');
            var replaceTo = str.indexOf('}');
            var curPos = 0;
            while(replaceFrom >= 0 && replaceTo >= 0) {
                if(replaceFrom > curPos) {
                    split.strings.push(str.slice(curPos, replaceFrom));
                }
                var varname = str.slice(replaceFrom+1, replaceTo);
                split.varToArrMap[varname] = split.strings.length;
                split.strings.push(null);
                curPos = replaceTo+1;

                replaceFrom = str.indexOf('{', curPos);
                replaceTo = str.indexOf('}', curPos);
            }

            if(curPos < str.length-1) {
                split.strings.push(str.slice(curPos));
            }
            this.map[type] = split;
        }
    }

    ObjectParser.prototype.parse = function(obj, type) {
        if(type === undefined) {
            type = obj.type;
        }

        u.assert(type in this.map);
        var split = this.map[type];
        for(var varname in split.varToArrMap) {
            u.assert(varname in obj);
            split.strings[split.varToArrMap[varname]] = obj[varname];
        }
        return split.strings.join('');
    }

    return ObjectParser;
});
