/**
 * CursorControl for abcjs - handles visual highlighting during music playback
 * Using function constructor format as expected by abcjs
 */
function CursorControl() {
  this.currentHighlightedElements = [];
  this.highlightClass = 'note-highlight';

  /**
   * Called when the tune is ready to play
   */
  this.onReady = function() {
    console.log('CursorControl: Tune ready');
  };

  /**
   * Called when playback starts
   */
  this.onStart = function() {
    console.log('CursorControl: Playback started');
  };

  /**
   * Called when playback finishes
   */
  this.onFinished = function() {
    console.log('CursorControl: Playback finished');
    this.clearHighlights();
  }.bind(this);

  /**
   * Called by abcjs for each note/rest/bar during playback
   * @param {Object} event - Contains elements, measureStart, and position info
   */
  this.onEvent = function(event) {
    console.log('CursorControl onEvent called:', event);
    
    // Clear previous highlights
    this.clearHighlights();

    // Highlight current elements if they exist
    if (event.elements && event.elements.length > 0) {
      console.log(`Highlighting ${event.elements.length} elements:`, event.elements);
      
      event.elements.forEach((element, index) => {
        console.log(`Element ${index}:`, element);
        if (element) {
          // Handle both HTML and SVG elements
          if (element.classList) {
            // HTML element
            element.classList.add(this.highlightClass);
            this.currentHighlightedElements.push(element);
            console.log(`Added ${this.highlightClass} class to HTML element:`, element);
          } else if (element.className && element.className.baseVal !== undefined) {
            // SVG element - use className.baseVal
            const currentClasses = element.className.baseVal || '';
            element.className.baseVal = currentClasses + (currentClasses ? ' ' : '') + this.highlightClass;
            this.currentHighlightedElements.push(element);
            console.log(`Added ${this.highlightClass} class to SVG element:`, element);
          } else {
            // Try setAttribute as fallback
            const currentClass = element.getAttribute('class') || '';
            element.setAttribute('class', currentClass + (currentClass ? ' ' : '') + this.highlightClass);
            this.currentHighlightedElements.push(element);
            console.log(`Added ${this.highlightClass} class via setAttribute:`, element);
          }
        } else {
          console.log(`Element ${index} is null or undefined`);
        }
      });
    } else {
      console.log('No elements to highlight in event:', event);
    }
  }.bind(this);

  /**
   * Called by abcjs for each beat during playback
   * @param {number} beatNumber - Current beat number
   * @param {number} totalBeats - Total beats in the piece
   * @param {number} totalTime - Total time elapsed
   */
  this.onBeat = function(beatNumber, totalBeats, totalTime) { // eslint-disable-line no-unused-vars
    // Can be used for additional beat-based animations if needed
    // console.log(`Beat ${beatNumber}/${totalBeats}, time: ${totalTime}ms`);
  };

  /**
   * Called when playback reaches the end of a line (for scrolling)
   * @param {Object} data - Contains timing and position information
   */
  this.onLineEnd = function(data) { // eslint-disable-line no-unused-vars
    // Handle line scrolling if needed in the future
    // console.log('Line end reached:', data);
  };

  /**
   * Clear all current highlights
   */
  this.clearHighlights = function() {
    this.currentHighlightedElements.forEach(element => {
      if (element) {
        // Handle both HTML and SVG elements
        if (element.classList) {
          // HTML element
          element.classList.remove(this.highlightClass);
        } else if (element.className && element.className.baseVal !== undefined) {
          // SVG element - use className.baseVal
          const currentClasses = element.className.baseVal || '';
          element.className.baseVal = currentClasses
            .split(' ')
            .filter(cls => cls !== this.highlightClass)
            .join(' ');
        } else {
          // Try getAttribute/setAttribute as fallback
          const currentClass = element.getAttribute('class') || '';
          const newClass = currentClass
            .split(' ')
            .filter(cls => cls !== this.highlightClass)
            .join(' ');
          element.setAttribute('class', newClass);
        }
      }
    });
    this.currentHighlightedElements = [];
  }.bind(this);

  /**
   * Reset the cursor control (called when playback stops or new music loads)
   */
  this.reset = function() {
    this.clearHighlights();
  }.bind(this);
}

export default CursorControl;