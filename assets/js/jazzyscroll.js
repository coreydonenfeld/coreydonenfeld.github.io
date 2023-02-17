let supportsIntersectionObserver = ('IntersectionObserver' in window) && ('IntersectionObserverEntry' in window) && ('intersectionRatio' in window.IntersectionObserverEntry.prototype);

/**
 * The Jazziest of all the Scrolls.
 * 
 * JazzyScroll is a light-weight JS scroll plugin that animates elements with a "[data-jazzy-scroll]" attribute based on whether the element is in the viewport.
 * 
 * All the animations are handled in CSS.
 * 
 * @since 1.0.0
 * 
 * @author Corey Donenfeld
 * @link 
 * 
 * @param {{speed: (Number|String), delay: (Number|String), offset: Number}} settings Initializer settings
 */
function JazzyScroll(settings = []) {
    const _this = this;
    const _jazzyElements = document.querySelectorAll('[data-jazzy-scroll]:not(.animated-in)');
    const _defaultSpeed = 500;
    const _defaultDelay = 0;
    const _defaultOffset = 0;
    
    this.speed = settings.speed || _defaultSpeed;
    this.delay = settings.delay || _defaultDelay;
    this.offset = settings.offset || _defaultOffset;

    /**
     * Helper function to animate in an element.
     * 
     * @param {Node} element The Jazzy Element.
     */
    this.animateIn = function(element) {
        const animationType = element.getAttribute('data-jazzy-scroll');

        // If the animation type includes 'count' (name reserved for this),
        // look for a 'data-jazzy-scroll-count-start' attribute (or default to zero),
        // look for a 'data-jazzy-scroll-count-end' attribute (or default to the element text),
        // and implement the `animateNumber()` function so the element animates from the start to end number.
        if (animationType.includes('count')) {
            let startNumber = parseInt(element.getAttribute('data-jazzy-scroll-count-start') || 0);
            let endNumber = parseInt(element.getAttribute('data-jazzy-scroll-count-end') || element.textContent);

            if (!isNaN(startNumber) && !isNaN(endNumber)) {
                animateNumber(element, startNumber, endNumber, _this.speed);
            }
        }

        element.classList.add('animated-in');
    }

    /**
     * If the client is on a mobile device, default the offset to zero.
     */
    if (typeof window.orientation !== 'undefined') {
        this.offset = 0;
    }

    /**
     * If the client is on a browser that supports IntersectionObserver utilize that.
     * Otherwise use an array-based implementation with a custom inViewport function.
     */
    if (supportsIntersectionObserver) {

        this.options = {
            rootMargin: '0px 0px ' + (this.offset * -1) + 'px 0px',
            threshold: [0, 1]
        }

        /**
         * Add an element to the jazzyElements array.
         * 
         * @param {Node} element The element to be added.
         */
        this.addElement = function(element) {
            element.jazzySpeed = (element.getAttribute('data-jazzy-scroll-speed') ? element.getAttribute('data-jazzy-scroll-speed') : _this.speed) + 'ms';
            element.jazzyDelay = (element.getAttribute('data-jazzy-scroll-delay') ? element.getAttribute('data-jazzy-scroll-delay') : _this.delay) + 'ms';
            element.jazzyOffset = parseInt(element.getAttribute('data-jazzy-scroll-offset') ? element.getAttribute('data-jazzy-scroll-offset') : _this.offset);
            element.options = this.options;
            element.options.rootMargin = '0px 0px ' + (element.jazzyOffset * -1) + 'px 0px';
            element.style.transitionDuration = element.jazzySpeed;
            element.style.transitionDelay = element.jazzyDelay;

            // Create an IntersectionObserver for the element.
            // When the element is in view it gets the "animated-in" and the observer gets disconnected.
            let intersectionObserver = new IntersectionObserver(function(entries) {
                entry = entries[0];

                // If the entry is intersection, the target is in view (or above) and gets animated in.
                if (entry.isIntersecting || entry.boundingClientRect.top <= 0) {
                    // Animate in the element
                    _this.animateIn(entry.target);

                    // Disconnect the observer
                    intersectionObserver.disconnect(entry.target);
                }
            }, element.options);
            intersectionObserver.observe(element);
        }

        /**
         * Add all the elements with the "[data-jazzy-scroll]" attribute from page load to the jazzyElements array.
         */
        this.init = function() {
            for (let i = 0; i < _jazzyElements.length; i++) {
                _this.addElement(_jazzyElements[i]);
            }
        }

        _this.init();

    } else {

        let viewportBottom = window.innerHeight;
        this.jazzyElements = [];

        /**
         * Add an element to the jazzyElements array.
         * 
         * @param {Node} element The element to be added.
         */
        this.addElement = function(element) {
            element.jazzySpeed = (element.getAttribute('data-jazzy-scroll-speed') ? element.getAttribute('data-jazzy-scroll-speed') : _this.speed) + 'ms';
            element.jazzyDelay = (element.getAttribute('data-jazzy-scroll-delay') ? element.getAttribute('data-jazzy-scroll-delay') : _this.delay) + 'ms';
            element.jazzyOffset = parseInt(element.getAttribute('data-jazzy-scroll-offset') ? element.getAttribute('data-jazzy-scroll-offset') : _this.offset);
            element.style.transitionDuration = element.jazzySpeed;
            element.style.transitionDelay = element.jazzyDelay;
            _this.jazzyElements.push(element);
        }

        /**
         * Determines if an element is in vertical viewport.
         * The calculation is based upon if the element's position from the top plus the offset variable is less than or equal to the height of the window (or the position at the bottom of the window).
         * A positive offset pushes the inViewport point down; a negative offset will yield true further up on the page.
         * 
         * @param {Node} element The element in question.
         */
        this.isInViewport = function(element) {
            return element.getBoundingClientRect().top + element.jazzyOffset <= viewportBottom;
        }

        /**
         * Initialize the helper function that loops through all non animated-in jazzyElements
         * and determines if they should be animated in or not.
         */
        this.init = function() {
            for (let i = _this.jazzyElements.length - 1; i >= 0; i--) {
                let element = _this.jazzyElements[i];
                if (_this.isInViewport(element)) {
                    // Animate in the element
                    _this.animateIn(element);

                    // Remove the element from the array and increase the index offset by one.
                    _this.jazzyElements.splice(i, 1);
                }
            }

            window.requestAnimationFrame(_this.init);
        };

        /**
         * Add all the elements with the "[data-jazzy-scroll]" attribute from page load to the jazzyElements array.
         */
        for (let i = 0; i < _jazzyElements.length; i++) {
            _this.addElement(_jazzyElements[i]);
        }

        /**
         * Trigger the init function.
         */
        window.requestAnimationFrame(_this.init);

        /**
         * Adjust the viewport bottom on window resize.
         */
        window.addEventListener('resize', function() {
            if (viewportBottom !== window.innerHeight) {
                viewportBottom = window.innerHeight;
            }
        });

    }

    /**
     * On DOM changes, check and include updated [data-jazzy-scroll] elements to the jazzyElements array.
     */
    const observerOptions = {
        attributes: false,
        characterData: false,
        childList: true,
        subtree: true
    }

    const observer = new MutationObserver(function(mutationsList) {
        // Loop through the list of changes to the DOM
        for (let i = 0; i < mutationsList.length; i++) {
            // Loop through the addedNode (NodeList) of each mutation
            for (let x = 0; x < mutationsList[i].addedNodes.length; x++) {
                // Check that the Node is an element 
                if (mutationsList[i].addedNodes[x].nodeType == Node.ELEMENT_NODE) {
                    // If the Node is a Jazzy element that has not been animated-in yet, add it to the jazzyElements array
                    if (mutationsList[i].addedNodes[x].matches('[data-jazzy-scroll]:not(.animated-in)')) {
                        _this.addElement(mutationsList[i].addedNodes[x]);
                    }
                    // Loop through the Node's children looking for other non animated-in Jazzy element's to add to the jazzyElements array
                    for (let y = 0; y < mutationsList[i].addedNodes[x].querySelectorAll('[data-jazzy-scroll]:not(.animated-in)').length; y++) {
                        _this.addElement(mutationsList[i].addedNodes[x].querySelectorAll('[data-jazzy-scroll]:not(.animated-in)')[y]);
                    }
                }
            }
        }
    });

    observer.observe(document, observerOptions);

}

/**
 * Animate an element from a start to end number across a duration.
 * For example, an element starts at 0 and animates to 100 taking 800ms.
 * 
 * @param {Node} element The element to be animated
 * @param {Number} start The start number
 * @param {Number} end The end number the element will be
 * @param {Number} duration Millisecond duration the animation should take
 */
function animateNumber(element, start, end, duration) {
    let startTimestamp = null;

    const step = (timestamp) => {
        if (!startTimestamp) {
            startTimestamp = timestamp;
        }

        // Get the progress in the animation
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);

        // Update the element's number
        element.textContent = Math.floor(progress * (end - start) + start);

        // Stop the recursion if the animation is at the duration 
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };

    // Start the recursive call with RAF
    window.requestAnimationFrame(step);
}