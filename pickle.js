const Base64 = require('js-base64');
let pickle = {}


function isPlainObject(obj) { //是否是纯粹对象
    if (typeof obj !== 'object' || obj === null) return false

    let proto = obj
    while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto)
    }

    return Object.getPrototypeOf(obj) === proto
}

function decycle(object, replacer) {
    "use strict";
    var objects = new WeakMap(); // object to path mappings

    return (function derez(value, path) {
        var old_path; // The path of an earlier occurance of value
        var nu; // The new object or array
        if (replacer !== undefined) {
            value = replacer(value);
        }

        // 对函数的处理
        if ( typeof value === 'function' ){
            return value.toString()

        } else if (isPlainObject(value) || Array.isArray(value)) {//纯

            old_path = objects.get(value);
            //				console.log('aaa','path=',path,' old_path=',old_path);
            if (old_path !== undefined) {
                return {
                    $ref: old_path
                };
            }

            objects.set(value, path);
            if (Array.isArray(value)) {
                nu = [];
                value.forEach(function (element, i) {
                    nu[i] = derez(element, path + "[" + i + "]");
                });
            } else {
                nu = {};
                Object.keys(value).forEach(function (name) {
                    nu[name] = derez(
                        value[name],
                        path + "[" + JSON.stringify(name) + "]"
                    );
                });
            }
            return nu;
        }
        return value;
    }(object, "$"));
}


function retrocycle($) {
    "use strict";
    var px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\(?:[\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*")\])*$/;
    (function rez(value) {

        if (value && typeof value === "object") {
            if (Array.isArray(value)) {
                value.forEach(function (element, i) {
                    if (typeof element === "object" && element !== null) {
                        var path = element.$ref;
                        if (typeof path === "string" && px.test(path)) {

                            value[i] = eval(path);
                        } else {
                            rez(element);
                        }
                    }

                    if ( typeof element === 'string' && element.startsWith("function") && element.endsWith("}")){
                        try {
                            value[i] = eval("(false || " + element + ")");
                        }catch (e) { }

                    }
                });
            } else {
                Object.keys(value).forEach(function (name) {
                    var item = value[name];
                    if (typeof item === "object" && item !== null) {
                        var path = item.$ref;
                        if (typeof path === "string" && px.test(path)) {

                            value[name] = eval(path);
                        } else {
                            rez(item);
                        }
                    }



                    if ( typeof item === 'string' && item.startsWith("function") && item.endsWith("}")){
                        try {
                            item = eval("(false || "+item+")");
                            value[name] = item
                        }catch (e) {}
                    }
                });
            }
        }
    }($));
    return $;
}


pickle.dumps = function( o ){
    return JSON.stringify(decycle( o ));
}


pickle.loads = function( o ){
    return retrocycle (JSON.parse( o )) ;
}


pickle.dumpBase64 = function( o ){
    return Base64.encode( pickle.dumps( o ) );
}


pickle.loadBase64 = function( o ){
    return  pickle.loads( Base64.decode(o) ) ;
}


module.exports = Object.freeze( pickle )
