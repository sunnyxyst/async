var UI = (function() {
    function selectOption() {
        var selectBox = document.querySelectorAll('.select');
        var config = {attributes:true, childList: true, subtree: true}
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if(mutation.type == 'childList') {
                    if(comboBtn.firstChild.nodeType === 3) {
                        comboBtn.innerHTML = `<span class="btnValue selectSetText" role="text">${comboBtn.innerHTML}</span>`
                    }
                }
                observer.disconnect();
            })
        })
        observer.observe(e, config);

        comboBtn.addEventListender('click', function(ele) {
            observer.observe(e, config);
        })
    }
    function init() {
        window['stack'] = new Stack();
        selectOption();
    }
    function Information(selector) {
        if(document.querySelector(selector) == (null || undefined)) return;

        var target = document.querySelector(selector);
        var header = target.querySelector('.header');
        var tabs = target.querySelector('.tabs');
        var obj = {};

        Object.defineProperties(obj, {
            header: {
                get: function() {
                    return header;
                }
            },
            tabs: {
                get: function() {
                    return tabs;
                }
            }
        });
        return obj;
    }

    function Buffer(selector) {
        if(document.querySelector(selector) == (null || undefined)) return;
        var target = document.querySelector(selector);
        var contents = target.querySelector('.contents');
        var fixer = [].filter.call(content.children., function(x) {return x.classList.contains('fixer')})[0];
        var isFixer = (fixer) ? true:false;
        var bufferSize = (typeof size == 'number') ? size : 0;
        var obj = {};

        function nextFram() {
            return new Promise(resolve => requestAnimationFrame(resolve));
        }
        async function init() {
            if(target.classList.contains('main')) return;
            if(isFixer) {bufferSize += fixer.offsetHeight};
            
            bufferEl = target.querySelector('.buffer') || bufferEl;

            if(!target.querySelector('.buffer')) {
                contents.insertAdjacentElement('beforeend', bufferEl);
            }
            await nextFram();

            if(isFixer) {
                bufferSize = fixere.getBoundingClientRect().height;
            }
        }

        init();

        Object.defineProperties(obj, {
            get: {
                get: function() {
                    return bufferSize;
                }
            },
            init: {value: init},
        })
    }

    function stack() {
        var count = 1000;
        var stack = [];
        var obj = {};

        function set(dom) {
            if(dom) {
                stack.push(dom)
            }
        }

        function push(dom) {
            count++;
            if(dom) {
                stack.push(dom);
            }
            return count;
        }

        Object.defineProperties(obj, {
            print: {
                get: function() {
                    return stack();
                }
            },
            set: {value: set},
            push: {value: push}
        });
        return obj;
    }

    function stackPLAA11y(id) {
        var page = document.querySelector('.page');
        if(stack.prin.length === 0){
            stack.set(page);
        }
     }

     function Popup(id) {
        var popup = document.querySelector(id);
        var obj = {};
        function open(callback) {
            stackPLAA11y(id);
            var zIndex = stack.push(popup);

            Information = new Information(id);
            popupBuffer = new Buffer(id);

            if(callback instanceof Function) {
                callback();
            }
        }
        Object.defineProperties(obj, {
            open: {value: open},
            Information: {
                get: function() {
                    return Information;
                }
            },
            buffer: {
                get: function() {
                    return popupBuffer;
                }
            }
        });
        return obj;
     }
     
     function Layer(id) {
        var layer = document.querySelector(id);
        var obj = {};

        function open(callback) {
            new Promise(function(resolve) {
                setTimeout(resolve);
            }).then(setTimeout(function(){
                dim.open(id, true)
            })).then(setTimeout(function() {
                stackPLAA11y(id);
                Information = new Information(id);
                layerBuffer = new Buffer(id);

                if(callback instanceof Function) {callback();}
            }))
        }

        Object.defineProperties(obj, {
            open: {value: open},
            Information: {
                get: function() {
                    return Information;
                }
            },
            buffer: {
                get: function() {
                    return layerBuffer;
                }
            }
        });
        return obj;
     }

     return {
        init: init,
        Buffer: Buffer,
        Layer: Layer,
        Popup: Popup,
        Stack: Stack
     }
}());
UI.init();
var Popup = PLA(UI.Popup);
var Layer = PLA(UI.Layer);
function PLA(type) {
    return {
        open: function(id, callback) {
            window[id] = new type('#' + id);
            window[id].open(callback);
        }
    }
}