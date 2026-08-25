var UIComponent = UIComponent || {};

UIComponent.Event = {
    accordionOpen : new CustomEvent("accordionOpen"),
    accordionClose: new CustomEvent('accourdionClose')
}

UIComponent.mainAllMenu = function(props) {
    var _target = null;

    function init() {
        setAccordion();
    }

    function setAccordion() {
        $(_btnToggle).on('click', function() {
            if($(this).hasClass('active')) {

            } else {

            }
        })
    }
    init();
}

UIComponent.accordion = function(props) {
    var _dom = null;

    function init() {
        setDom();
    }
    function setDom() {
        _dom = props['dom'];
    }
    this.open = function() {
        setTimeout(function() {
            _dom.dispatchEvent(UIComponent.Event['accordionOpen']);
        })
    }

    this.close = function() {
        _dom.dispatchEvent(UIComponent.Event['accordionClose']);
    }

    init();
}