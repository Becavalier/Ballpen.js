import BallpenUtil from './ballpen-util.js';

class Observer {
	static observePath(obj, rootPath, paths, fns) {
        if (BallpenUtil.isArray(paths)) {
            let _path = obj;
            let _key;

            paths.forEach((key, index) => {
                if (/^\d+$/.test(key)) {
                    key = parseInt(key);
                }

                if (index < paths.length - 1) {
                    _path = _path[key];
                } else {    
                    _key = key;
                }
            });

            rootPath = paths.join('.');

            Observer.observeKey(_path, rootPath, _key, fns);
        }
    };

    static observeKey(obj, rootPath, key, fns = false) {            
        if (BallpenUtil.isArray(key)) {
            Observer.observePath(obj, rootPath, key, fns);
        } else {
            // Normal attribtues or computed attributes
            let isComputed = BallpenUtil.isObject(obj[key]);
            let yetVal = isComputed ? obj[key]['_value'] : obj[key];
            const currentPath = rootPath;
           
            if (BallpenUtil.isObject(yetVal)) {
                Object.defineProperty(obj, key, {
                    get: () => {
                        return yetVal;
                    },
                    set: (nowVal) => {  
                        if (nowVal !== yetVal) {
                            fns && fns.forEach((fn) => {
                                fn.call(this, yetVal, nowVal);
                            });

                            yetVal = nowVal;

                            // Disabled when update a computed attribute
                            if (!isComputed) {
                                BallpenUtil.renderObjectValueByPath(this.$dataListPure, currentPath, nowVal);
                            }
                        }
                    },
                    enumerable: true,
                    configurable: true
                });

                Object.keys(yetVal).forEach((key) => {
                    Observer.observeKey(yetVal, currentPath + '.' + key, key, fns);
                });
            } else if (BallpenUtil.isArray(yetVal)) {
                Object.defineProperty(obj, key, {
                    get: () => {
                        return yetVal;
                    },
                    set: (nowVal) => {  
                        if (nowVal !== yetVal) {
                            fns && fns.forEach((fn) => {
                                fn.call(this, yetVal, nowVal);
                            });

                            yetVal = nowVal;

                            if (!isComputed) {
                                BallpenUtil.renderObjectValueByPath(this.$dataListPure, currentPath, nowVal);
                            }
                        }
                    },
                    enumerable: true,
                    configurable: true
                });

                Observer.observeArray(yetVal, currentPath, fns);
            } else {
                Object.defineProperty(obj, key, {
                    get: () => {
                        return yetVal;
                    },
                    set: (nowVal) => {  
                        if (nowVal !== yetVal) {
                            fns && fns.forEach((fn) => {
                                fn.call(this, yetVal, nowVal);
                            });

                            yetVal = nowVal;

                            if (!isComputed) {
                                BallpenUtil.renderObjectValueByPath(this.$dataListPure, currentPath, nowVal);
                            }
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
            }
        }
    };
    
    static observeArray(arr, rootPath, fns = false) {
        const mutatorMethods = ['copyWithin', 'fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'];
        const arrayProto = Array.prototype;

        // Prevent from polluting the global 'Array.prototype'
        const hijackProto = Object.create(arrayProto);

        const currentPath = rootPath;

        mutatorMethods.forEach((method) => {
            Object.defineProperty(hijackProto, method, {
                enumerable: true,
                configurable: true,
                writable: true,
                value: (...args) => {
                    let yetVal = arr.slice();
                    let resultVal = arrayProto[method].call(arr, ...args);
                    let nowVal = arr;

                    BallpenUtil.renderObjectValueByPath(this.$dataListPure, currentPath, nowVal);
                    // Callback
                    fns && fns.forEach((fn) => {
                        fn.call(this, yetVal, nowVal);
                    }); 

                    return resultVal;
                } 
            });
        });
        /* eslint-disable */
        arr.__proto__ = hijackProto;
        // arr.__proto__.__proto__ === Array.prototype; // true
    };

    static register(registers, obj, objCompute, key, fn) {
        if (BallpenUtil.isObject(key)) {
            // For computed attributes
            const register = registers.find((item) => {
                if (Object.is(item.obj, objCompute) && (item.key === key.real || item.key.toString() === key.real.toString())) {
                    return item;
                }
            });

            if (register) {
                register.fns.push(fn);
            } else {
                registers.push({
                    obj: objCompute,
                    rootPath: [],
                    key: key.real.substring(1),  // Remove '*' at the top of computed attribute
                    fns: [fn]
                });
            }

            // Set setter/getter on inner children
            for (let _k in key.base) {
                const register = registers.find((item) => {
                    if (Object.is(item.obj, obj) && (item.key === _k || item.key.toString() === _k.toString())) {
                        return item;
                    }
                });

                let fn = (yetVal, nowVal) => {
                    if (nowVal !== yetVal) {
                        console.log(11);
                    }
                };

                if (register) {
                    register.fns.push(fn);
                } else {
                    registers.push({
                        obj: obj,
                        rootPath: [],
                        key: _k,
                        fns: [fn]
                    });
                }
            }
        } else if (BallpenUtil.isArray(key)) {
            const register = registers.find((item) => {
                if (Object.is(item.obj, obj) && (item.key === key || item.key.toString() === key.toString())) {
                    return item;
                }
            });

            if (register) {
                register.fns.push(fn);
            } else {
                registers.push({
                    obj: obj,
                    rootPath: [],
                    key: key,
                    fns: [fn]
                });
            }
        }
    };

    static attach(registers) {
        registers.forEach((register) => {
            Observer.observeKey(register.obj, register.rootPath, register.key, register.fns);
        });
    };
}

export default Observer;
