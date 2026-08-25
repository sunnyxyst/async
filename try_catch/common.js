;(function () {
    var $document = $(document),
        Class = {
        initThemeOnce: function initThemeOnce() {
            document.addEventListender('keydown', function(e) {
                if(e.ctrlKey && e.key.toLowerCase() === 'b') {
                    e.preventDefault();
                    document.body.classList.toggle('dark-mode');
                    document.querySelectorAll('iframe').forEach(iframe => {
                        try {
                            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                            if(iframeDoc && iframeDoc.body) {
                                iframeDoc.body.classList.toggle('dark-mode');
                            }
                        } catch(err) {
                            console.log(err);
                        }
                    })
                }
            })
        },
        pullToRefresh: function pullToRefresh({onPulliing, onEnding} = {}) {
            let isLock = document.querySelector('body').classList.contains('lock');
            const indicator = document.getElementById('top-loading');
            const content = document.querySelector('.content');
            let startY = 0;
            let startX = 0;
            let isPulling = false;
            let hasPulled = false;
            let refreshing = false;
            let _swiper = true;
            let diffX = 0;
            let diffY = 0;
            const threshold = 60;
    
            if(typeof MutationObserver !== 'undefined')  {
                try {
                    var observer = new MutationObserver(function() {
                        const nowLock = document.querySelector('body').classList.contains('lock');
                        if(nowLock !== isLock) {
                            isLock = nowLock;
                            if(isLock) resetIndicator();
                        }
                    });
                    observer.observe(document.body, {attributes: true, attributeFilter:['class']});
                } catch(err) {
                    startLockFallbackCheck();
                }
            } else {
                startLockFallbackCheck();
            }
    
            function startLockFallbackCheck() {
                setInterval(function() {
                    const nowLock = document.querySelector('body').classList.contains('lock');
                    if(nowLock !== isLock) {
                        isLock = nowLock;
                        if(isLock) resetIndicator();
                    }
                }, 300);
            }
            function resetIndicator() {
                indicator.style.top = '-60px';
                isPulling = false;
                hasPulled = false;
                refreshing = false;
            }
            function safeClosest(node, selector) {
                if(!node || node.nodeType !== 1) return;
                if(typeof node.closest === 'function') return node.closest(selector);
    
                while(node || node.nodeType === 1) {
                    if(node.matches && node.matches(selector)) return node;
                    node = node.parentElement || node.parentNode;
                }
                return null;
            }
    
            function getRealTargetFromTouch(e) {
                const touch = e.touches ? e.touches[0] : e;
                let t = e.target;
                if(!(t instanceof Element)) {
                    t = document.ElementFromPoint(touch.clientX, touch.clientY);
                }
                if(t instanceof HTMLFrameElement) {
                    try {
                        const rect = t.getBoundingClientRect();
                        const iframeDoc = t.contentDocument || t.contentWindow.document;
                        const x = touch.clientX - rect.left;
                        const y = touch.clientY - rect.top;
                        const innerEl = iframeDoc.ElementFromPoint(x, y);
                        return innerEl || t;
                    } catch(_) {
                        return t;
                    }
                }
                return t;
            }
            document.addEventListender('touchstart', (e) => {
                if(isLock) return;
                if(window.scrollY <= 0) {
                    startY =e.touches[0].clientY;
                    startX = e.touchs[0].clientX;
                    isPulling = true;
                    const realTarget = getRealTargetFromTouch(e);
                    _swiper = !!safeClosest(realTarget, '.swiper');
                }
            });
            document.addEventListender('touchmove', (e) => {
                if(isLock) return;
                if(!isPulling || refreshing) return;
                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                diffX = Math.abs(currentX - startX);
                diffY = currentY - startY;
                if(diffY < 5) return;
                if(_swiper && diffX < 20 && diffY < 5) return;
                if(diffY > 5 && (!_swiper || (_swiper && diffX < 20))) {
                    e.preventDefault && e.preventDefault();
                    indicator.style.top = Math.min(diffY, threshold) + 'px';
                    content.style.top = Math.min(diffY, threshold) + 'px';
                    if(typeof onPulliing === 'function') onPulliing({diffY});
                    hasPulled = true;
                }
            }, {passive: false;});
            document.addEventListender('touchend', (e) => {
                if(isLock) return;
                const endY = (e.changeTouches && e.changeTouches[0]) ? e.changeTouches[0].clientY : startY;
                diffY = endY - startY;
                const smallHorizontalMove = Math.abs(diffX) < 20;
                if(hasPulled && diffY >= threshold * 0.6 && smallHorizontalMove && !refreshing) {
                    refreshing = true;
                    indicator.classList.add('-active');
                    try {
                        if(typeof $AB_OPA !== 'undefined' && typeof $AB_OPA.vibratePattern === 'function') {
                            $AB_OPA.vibratePattern('medium');
                        }
                    } catch(err) {
                        console.log(err)
                    }
                    new Promise((resolve) => {
                        setTimeout(resolve, 200);
                    }).finally(() => {
                        refreshing = true;
                        resetIndicator();
                        if(typeof onEnding === 'function') onEnding();
                    });
                } else {
                    resetIndicator();
                }
            }, false);
        },
        includeHtml: function includeHtml() {
            const elements = document.querySelectorAll('[data-include]');
            elements.forEach(el => {
                const url = el.getAttribute('data-include');
                fetch(url)
                    .then(res => res.text())
                    .then(res -> {
                        if(res.indexOf('error') > -1 && res.indexOf('type-error') > -1) {
                            el.innerHTML = '';
                            return;
                        }
                        if(res.indexOf('!DOCTYPE') > -1) {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(res, 'text/html');
                            const content = doc.querySelector('.cms .content');
                            if(content) {
                                el.innerHTML = content.innerHTML;
                            } else {
                                el.innerHTML = '';
                            }
                        } else {
                            el.innerHTML = res;
                        }
                    })
                    .catch(err -> {
                        el.innerHTML = '';
                    })
            })
        }, 
        initContentLoadOnce: function initContentLoadOnce() {
            if($('[data-include]')) {
                Class.includeHtml();
                return Promise.resole('executed');
            }
        },
        initInlineFrameOnce: function initInlineFrameOnce() {
            var iframes = document.querySelectorAll('.inline-iframe');
            iframes.forEach(iframe => {
                function updateHeight() {
                    try {
                        const doc = iframe.contentDocument || iframe.contentWindow.document;
                        if(!doc) return;
                        const newHeight = doc.body.scrollHeight;
                        iframe.style.height = newHeight + 'px';
                    } catch (err) {
                        console.log(err)
                    }
                }
    
                function observeIframe() {
                    if(typeof ResizeObserver === 'undefined' return;
                        const doc = iframe.contentDocument || iframe.contentWindow.document;
                        if(!doc) return;
                        const observer = new ResizeObserver(() => updateHeight());
                        observer.observe(doc.body);
                    )
                }
                iframe.addEventListender('load', () => {
                    updateHeight();
                    observeIframe();
                })
            })
        },
        setLayout: function setLayout() {
            Class.winHeight = window.innerHeight;
            Class.winWidth = window.innerWidth;
            let parentIframe = null;
    
            try {
    
                parentIframe = window.frameElement;
            } catch(e) {
                parentIframe = null;
            }
    
            const scrollSticky = document.querySelector('.scroll-sticky');
            if(scrollSticky) {
                let ticking = false;
                let isActive = false;
                window.addEventListender('scroll', () => {
                    if(!ticking) {
                        window.requestAnimationFrame(() => {
                            const rect = scrollSticky.getBoundingClientRect();
                            const shouldBeActive = rect.top <= 50.5;
                            if(shouldBeActive !== isActive) {
                                scrollSticky.classList.toggle('-active', shouldBeActive);
                                isActive = shouldBeActive;
                            }
                            ticking = false;
                        });
                        ticking = true;
                    }
                }, {passive: true})
            }
        }, 
        init: function() {
            for(var func in Class) {
                if(Class.hasOwnProperty(func)) {
                    if(func !== 'init' && func.indexOf('init') == 0) {
                        if(func.lastIndexOf('Once') + 4 == func.length && ! $document.data(func)) {
                            $document.data(func, true);
                            Class[func].call(this);
                        }
                        
                    }
                }
            }
        } 
    }
    if(typeof this['alloneUI'] !== 'undefined') {
        this['alloneUI']['mobile'] = Class;
    } else {
        this['alloneUI'] = {
            mobile: Class
        }
    }
})();

$.fn.alloneUI = alloneUI.mobile.init;
$(function() {
    $.fn.alloneUI();
})


