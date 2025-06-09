/***********************************************

 "toast.js"

 Created by Michael Cheng on 05/31/2015 22:34
 http://michaelcheng.us/
 michael@michaelcheng.us
 --All Rights Reserved--

 ***********************************************/

'use strict';

/**
 * The Toast animation speed; how long the Toast takes to move to and from the screen
 * @type {Number}
 */
const TOAST_ANIMATION_SPEED = 400;

const Transitions = {
    SHOW: {
        '-webkit-transition': 'opacity ' + TOAST_ANIMATION_SPEED + 'ms, -webkit-transform ' + TOAST_ANIMATION_SPEED + 'ms',
        'transition': 'opacity ' + TOAST_ANIMATION_SPEED + 'ms, transform ' + TOAST_ANIMATION_SPEED + 'ms',
        'opacity': '1',
        '-webkit-transform': 'translateY(-100%) translateZ(0)',
        'transform': 'translateY(-100%) translateZ(0)'
    },

    HIDE: {
        'opacity': '0',
        '-webkit-transform': 'translateY(150%) translateZ(0)',
        'transform': 'translateY(150%) translateZ(0)'
    }
};

/**
 * The main Toast object
 * @param {String} text    The text to put inside the Toast
 * @param {Object} options Optional; the Toast options. See Toast.prototype.DEFAULT_SETTINGS for more information
 * @param {Object} transitions Optional; the Transitions object. This should not be used unless you know what you're doing
 */
function Toast(text, options, transitions) {
    if(getToastStage() !== null) {
        // If there is already a Toast being shown, put this Toast in the queue to show later
        Toast.prototype.toastQueue.push({
            text: text,
            options: options,
            transitions: transitions
        });
    } else {
        Toast.prototype.Transitions = transitions || Transitions;
        var _options = options || {};
        _options = Toast.prototype.mergeOptions(Toast.prototype.DEFAULT_SETTINGS, _options);

        Toast.prototype.show(text, _options);

        _options = null;
    }
}


/**
 * The toastStage. This is the HTML element in which the toast resides
 * Getter and setter methods are available privately
 * @type {Element}
 */
var _toastStage = null;
function getToastStage() {
    return _toastStage;
}
function setToastStage(toastStage) {
    _toastStage = toastStage;
}




// define some Toast constants

/**
 * The default Toast settings
 * @type {Object}
 */
Toast.prototype.DEFAULT_SETTINGS = {
    style: {
        main: {
            'background': 'rgba(0, 0, 0, .8)',
            'box-shadow': '0 0 10px rgba(0, 0, 0, .8)',

            'border-radius': '3px',

            'z-index': '99999',

            'color': 'rgba(255, 255, 255, .9)',

            'padding': '10px 15px',
            'max-width': '60%',
            'width': '100%',
            'word-break': 'keep-all',
            'margin': '0 auto',
            'text-align': 'center',

            'position': 'fixed',
            'left': '0',
            'right': '0',
            'bottom': '0',

            '-webkit-transform': 'translateY(150%) translateZ(0)',
            'transform': 'translateY(150%) translateZ(0)',
            '-webkit-filter': 'blur(0)',
            'opacity': '0'
        }
    },

    settings: {
        duration: 4000
    }
};

Toast.prototype.Transitions = {};


/**
 * The queue of Toasts waiting to be shown
 * @type {Array}
 */
Toast.prototype.toastQueue = [];


/**
 * The Timeout object for animations.
 * This should be shared among the Toasts, because timeouts may be cancelled e.g. on explicit call of hide()
 * @type {Object}
 */
Toast.prototype.timeout = null;


/**
 * Merge the DEFAULT_SETTINGS with the user defined options if specified
 * @param  {Object} options The user defined options
 */
Toast.prototype.mergeOptions = function(initialOptions, customOptions) {
    var merged = customOptions;
    for(var prop in initialOptions) {
        if(merged.hasOwnProperty(prop)) {
            if(initialOptions[prop] !== null && initialOptions[prop].constructor === Object) {
                merged[prop] = Toast.prototype.mergeOptions(initialOptions[prop], merged[prop]);
            }
        } else {
            merged[prop] = initialOptions[prop];
        }
    }
    return merged;
};


/**
 * Generate the Toast with the specified text.
 * @param  {String|Object} text    The text to show inside the Toast, can be an HTML element or plain text
 * @param  {Object} style   The style to set for the Toast
 */
Toast.prototype.generate = function(text, style) {
    var toastStage = document.createElement('div');


    /**
     * If the text is a String, create a textNode for appending
     */
    if(typeof text === 'string') {
        text = document.createTextNode(text);
    }
    toastStage.appendChild(text);


    setToastStage(toastStage);
    toastStage = null;

    Toast.prototype.stylize(getToastStage(), style);
};

/**
 * Stylize the Toast.
 * @param  {Element} element The HTML element to stylize
 * @param  {Object}  styles  An object containing the style to apply
 * @return                   Returns nothing
 */
Toast.prototype.stylize = function(element, styles) {
    Object.keys(styles).forEach(function(style) {
        element.style[style] = styles[style];
    });
};


/**
 * Show the Toast
 * @param  {String} text    The text to show inside the Toast
 * @param  {Object} options The object containing the options for the Toast
 */
Toast.prototype.show = function(text, options) {
    this.generate(text, options.style.main);

    var toastStage = getToastStage();
    document.body.insertBefore(toastStage, document.body.firstChild);



    // This is a hack to get animations started. Apparently without explicitly redrawing, it'll just attach the class and no animations would be done
    toastStage.offsetHeight;


    Toast.prototype.stylize(toastStage, Toast.prototype.Transitions.SHOW);


    toastStage = null;


    // Hide the Toast after the specified time
    clearTimeout(Toast.prototype.timeout);
    Toast.prototype.timeout = setTimeout(Toast.prototype.hide, options.settings.duration);
};


/**
 * Hide the Toast that's currently shown
 */
Toast.prototype.hide = function() {
    var toastStage = getToastStage();
    Toast.prototype.stylize(toastStage, Toast.prototype.Transitions.HIDE);

    // Destroy the Toast element after animations end
    clearTimeout(Toast.prototype.timeout);
    toastStage.addEventListener('transitionend', Toast.prototype.animationListener);
    toastStage = null;
};

Toast.prototype.animationListener = function() {
    getToastStage().removeEventListener('transitionend', Toast.prototype.animationListener);
    Toast.prototype.destroy.call(this);
};


/**
 * Clean up after the Toast slides away. Namely, removing the Toast from the DOM. After the Toast is cleaned up, display the next Toast in the queue if any exists
 */
Toast.prototype.destroy = function() {
    var toastStage = getToastStage();
    document.body.removeChild(toastStage);

    toastStage = null;
    setToastStage(null);


    if(Toast.prototype.toastQueue.length > 0) {
        // Show the rest of the Toasts in the queue if they exist

        var toast = Toast.prototype.toastQueue.shift();
        Toast(toast.text, toast.options, toast.transitions);

        // clean up
        toast = null;
    }
};

window.showToast = Toast;

"END OF FILE"; // to avoid "result is non-structured-clonable data"