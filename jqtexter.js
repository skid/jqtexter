/**
 * jQtexter is a jQuery plugin for simple text formatting.
 * It extends jQuery elements with methods that you can use
 * to get and set the text formatting of element contents.
 *
 * By "formatting" I mean placement of <strong> <em> <u> and <a> tags. 
 *
 * Dusko Jordanovski <jordanovskid@gmail.com>
 */
 
(function($){  
  var TEXT_NODE     = document.TEXT_NODE;
  var ELEMENT_NODE  = document.ELEMENT_NODE;

  /*
   * Helper function for comparing shallow objects
   * It is used for comparing passed attributes to HTML tags.
   * 
   * @param {Object} a First object to compare
   * @param {Object} b Second object to compare
   */
  function objectsAreSame(a, b){
    var i;
    for( i in a ) {
      if( !(i in b) || a[i] !== b[i] ) {
        return false;
      }
    }
    for( i in b ) {
      if( !(i in a) || a[i] !== b[i] ) {
        return false;
      }
    }
    return true;
  }

  /*
   * Text formatting extensions to jQuery prototype
   */
  $.fn.extend({
    
    /*
     * Returns the current selection if it's within this element. 
     * Otherwise returns null.
     *
     * @return {Object} an instance of Selection
     */ 
    __captureSelection: function () {
      var node                = this.get(0),
          selection           = window.getSelection(),
          isOrContainsAnchor  = false,
          isOrContainsFocus   = false,
          parentAnchor        = selection.anchorNode,
          parentFocus         = selection.focusNode;
    
      // Don't capture selection outside this node
      while( parentAnchor && parentAnchor != document.documentElement ) {
        if( parentAnchor == node ) {
          isOrContainsAnchor = true;
        }
        parentAnchor = parentAnchor.parentNode;
      }
      // Don't capture selection outside this node
      while( parentFocus && parentFocus != document.documentElement ) {
        if( parentFocus == node ) {
          isOrContainsFocus = true;
        }
        parentFocus = parentFocus.parentNode;
      }
      // If the selection object does not support getRangeAt, it's a lame browser
      if( isOrContainsAnchor && isOrContainsFocus ) {
        if(selection.getRangeAt === undefined) {
          alert("Your browser is not supported. Please use a modern browser like Firefox or Chrome.");
        }
        return selection;
      }
      return null;
    },
    
  
    /*
     * Returns an array of HTML child nodes that *completely* contain
     * the selection described with @sinfo. If the array has more
     * than one node, the second is a child of the first, 
     * the third is a child of the second, and so on.
     * 
     * @param {Object} sinfo Obtained by selection()
     * @return {Array} Array of HTML nodes
     */
    getSelectedNodes: function( sinfo ){
      var tags = [], 
          charPtr = 0;

      (function loop(){
        var node, textlen=0, i=0;

        while(node = this.childNodes[i++]){
          textlen = node.textContent.length;

          if(node.nodeType === ELEMENT_NODE){
            if(charPtr <= sinfo.start && (charPtr + textlen) >= sinfo.end) {
              tags.push(node);
            }
            loop.call(node);
          }
          charPtr += textlen;
        }
      }).call( this.get(0) );
    
      return tags;
    },
    
  
    /*
     * If no arguments are passed returns an object that gives us the start and end position.
     * in characters of the selection within this element.
     *
     * Example: { start: x, end: y, length: y-x }
     *
     * If an argument is passed, selects text within an element.
     * This method works with visible text characters. HTML tags are ignored.
     *
     * @param {Object} [selection] Selection info object: { start: 5, length: 10 }
     *
     * @return {Object, null} An object or null if the selection does not contain in this element. Returns `this` if called with an argument.
     */
    textSelection: function(){
      var selection, range, info, start, length, range, node, startIsSet, endIsSet;
      
      if(arguments.length === 0){
        info = { start: 0, end: 0, length: 0 };  
        
        if(!(selection = this.__captureSelection())) {
          return null;
        }
        
        range = selection.getRangeAt(0);
        (function loop(){
          var a, i=0;  
          if( range.startContainer === this ){
            if( this.nodeType === TEXT_NODE ){
              info.start += range.startOffset;
              return true;
            }
            for( i=0; i<range.startOffset; i++ )
              info.start += this.childNodes[i].textContent.length;
            return true;
          }
          if( this.nodeType === TEXT_NODE ){
            info.start += this.length;
            return false;
          }
          while(a = this.childNodes[i++])
            if( loop.call(a) )
              return true;
          return false;
        }).call(this.get(0));
    
        info.length = range.toString().length;
        info.end = info.start + info.length;
        return info;
      }
      
      // ----- Called with an argument -----
      start      = arguments[0].start  || 0,
      length     = arguments[0].length || 0,
      range      = document.createRange(),
      node       = this.get(0), 
      startIsSet = false, 
      endIsSet   = false;
    
      (function loop(){
        var a, l=0, i=0;
        while(a = this.childNodes[i++]){
          if(a.nodeType === TEXT_NODE){
            if( a.length >= start ){ // Range starts inside this text node
              if( !startIsSet ){     // Range has no startContainer set yet (defaults to document)
                range.setStart( a, start ); // This happens once since startContainer will now be set to node.childNodes[i]
                startIsSet = true;
                start += length;
              }
              if( a.length >= start && startIsSet ){ // Check again, start has maybe changed
                range.setEnd( a, start );
                endIsSet = true;
                return true; // end was found
              } 
            }
            start -= a.length;
          }
          else {
            if( (l = a.textContent.length ) >= start ){ // Range starts inside this element node
              loop.call(a);
              if( endIsSet ) { // Selection also ends within the child node
                return;
              }
            }
            else {
              start -= l;
            }
          }
        }
      }).call(node);
    
      selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      return this;
    },
  
    /*
     * If no arguments are passed:
     * Returns a formatting info object that contains the position of text-formatting tags inside this element. 
     * Touching tags of same type are coerced.
     * Example formatting info object: 
     * 
     * { 
     *   STRONG: [{start: 10, end: 16}, {start: 20, end: 27}],
     *   EM:     [{start: 14, end: 16}, {start: 25, end: 31}] 
     * }
     *
     * If arguments are passed:
     * Creates an optimal HTML markup from a string of text and a formatting info object.
     * It expects normalized tag information. This means no overlapping tags and no 
     * touching tags of same type with same attributes.
     *
     *  TAG      Occurences
     *  -----------------------
     *  <s>   4  : 11   20 : 25   - "S" tag appears from char 4 to char 11 and from char 20 to char 25
     *  <b>   12 : 14   16 : 19
     *  <i>   6  : 13   17 : 25
     *  <u>   3  : 7    14 : 19
     *
     *              s  s  s  s  s  s  s                             s  s  s  s  s 
     *                                         b  b     b  b  b
     *                    i  i  i  i  i  i  i              i  i  i  i  i  i  i  i
     *           u  u  u  u                       u  u  u  u  u
     *
     *  t  e  x  t  t  e  x  t  t  e  x  t  t  e  x  t  t  e  x  t  t  e  x  t  t  e  x  t  t  e  x
     *  0                            10                            20                            30
     *
     *  Produces: "tex<u>t<s>te<i>x</i></s></u><i><s>ttex</s>tt</i><b>e<u>x</u></b><u>t<b>t<i>ex</i></b></u><i>t<s>textt</s></i>exttex"
     * 
     * @param {Object} [formatting] See the example above on how the formatting info object should look
     * @param {String} [text] If passed, the element's text content will be replaced by this text
     *
     * @return {Object} If called with arguments, `this`, otherwise a formatting info object
     */
    textFormat: function (){
      var result, chars, formatting, text, tagName, tagInfo, tag, ctag, occ, i, j, k, 
          position, closing, attrs, data, html, stack, cstack, closeCounter;
      
      if(arguments.length === 0) {
        result = {};
        chars  = 0;
        (function loop(){
          var attr, attrs, node, record, tag, precord, j, i=0;
        
          while(node = this.childNodes[i++]) {
            attrs = {}, j=0;
            if(node.nodeType === TEXT_NODE) {
              chars += node.length;
              continue;
            }

            // It's an element node
            while(attr = node.attributes[j++]) {
              attrs[attr.name] = attr.nodeValue;
            }

            record = {start: chars, end: null, attrs: attrs};
            tag = (result[node.tagName] = result[node.tagName] || []);
            // Merge same tags with same attributes
            if( (precord = tag[ tag.length -1 ]) && precord.end >= record.start && objectsAreSame(precord.attrs, record.attrs) ){
              precord.end = record.end;
              record = precord;
            }
            else
              tag.push(record);
            loop.call(node);
            record.end = chars;
          }
        }).call( this.get(0) );
        return result;
      }
      
      // ----- Called with an argument -----
      
      formatting = arguments[0] || {}
      text       = arguments[1];
      text       = typeof text === 'string' ? text : this.text();
      data       = new Array(text.length);
      html       = [];

      for(tagName in formatting){ 
        if( !formatting.hasOwnProperty(tagName) ) {
          continue;
        }
        i = 0, tagInfo = formatting[tagName];
        while(tag = tagInfo[i++]){
          // This: data[15] = [{tag: "b", ends: 30}, {tag: "i", ends: 21}] 
          // From char 15 onwards there are 15 bold and 6 italic chars.
          (data[tag.start] = data[tag.start] || []).push({tag: tagName, ends: tag.end, attrs: tag.attrs});
        }
      }

      stack = [], cStack = [], closeCounter = {};
      for(i=0, j = text.length + 1; i < j; ++i ){
        if( position = data[i] ){
          // Sort the tags opened at this position by their length; Longer tags encompass smaller ones.
          position.sort(function(a, b){ return b.ends - a.ends; });
          k=0;
          while(tag = position[k++]){
            // Put the tags in the html, push them on stack and remember where they end
            stack.push(tag);
            attrs = [];
            if( tag.attrs ) {
              $.each(tag.attrs, function(name, value){ attrs.push(name + '="' + value + '"'); });
            }
            html.push("<", tag.tag, " ", attrs.join(" "), ">");
            closeCounter[tag.tag] = tag.ends;
          }
        }
      
        for( tagName in closeCounter ){
          // Some tag needs to be closed at this position
          if( i === (closing = closeCounter[tagName]) ){
            // Pop the stack until we get to our tag, closing all tags on top of it
            while(true){
              ctag = stack.pop();
              html.push("</", ctag.tag, ">");
              // Stop popping, we closed our tag. Remove it from the closeCounter.
              if( tagName === ctag.tag ){
                delete closeCounter[tagName];
                break;
              }
              // Keep track of popped tags before this one, we need to open them again
              cStack.push( ctag );
            }
            while( tag = cStack.pop() ){
              // It just so happens that this tag also ends here. So we don't reopen it.
              if( i === closeCounter[tag.tag] )
                delete closeCounter[tag.tag];
              // Otherwise, open it again
              else {
                stack.push(tag);
                attrs = [];
                if( tag.attrs ) {
                  $.each(tag.attrs, function(name, value){ 
                    attrs.push(name + '="' + value + '"'); 
                  });
                }
                html.push("<", tag.tag, " ", attrs.join(" "), ">");
              }
            }
          }
        }
        // A string with length 12 can will have indexes 0-11, but a range can be from 0 - 12 (the while string)
        // That's why we're making one additional pass without appending text.
        if( i< j) {
          html.push( text[i] );
        }
      }
      // We replace the first blank space with an &nbsp; because a leading space is not shown in paragraphs (bug?)
      return this.html( html.join("").replace(/^ /, "&nbsp;") );
    },

  
    /*
     * Receives a selection info object and a string (wrapper). 
     * It wraps the selection in a tag designated by the wrapper.
     * It returns normalized formatting, with no overlapping or touching tags of the same type.
     * 
     * Tags of the same type are still counted as different if their attributes are different.
     * In this case we can have touching tags of the same type. 
     * The selection always has precendence. It will steal portions from other tags if necessary.
     * 
     * @param {Object} sinfo Selection info obtained by textSelection()
     * @param {String} wrapper Name of the tag to wrap the selection in
     * @param {Object} attrs Attributes to add to the newly created tag
     * @param {Boolean} remove If set to true, the selection will clear its range from tags instead of adding new ones.
     */
    applyTag: function(sinfo, wrapper, attrs, remove){
      var i=0, j, wrapper = wrapper.toUpperCase(), attrs = attrs || {};
    
      // Selection range information
      var end   = sinfo.end;
      var start = sinfo.start;
    
      // Get data about contained element nodes.
      // This will already be normalized if you haven't manually edited the HTML.
      var finfo = this.textFormat();
    
      // Empty selections have no effect. This may change in the future.
      if( end > start && !(taglist = finfo[wrapper]) && !remove )
        finfo[wrapper] = [{ start:start, end:end, attrs: attrs }];

      else if( end > start ){
        var i=0, j=0;
        var tagReplacement = [], occ = taglist[j++];
        var tag, insideTag, insideSelection;

        // This loop normalizes tags by merging where necessary.
        // It depends on the fact that all tags appear in order, i.e. taglist[i].end < taglist[i+1].start
        // and that there are no empty or non-normalized tags.
        while( true ){
          // No more tag occurrences and the selection has ended, we're done
          if( !occ && end < i )
            break;
        
          insideSelection = start <= i && end > i;
          insideTag = occ && occ.start <= i && occ.end > i;

          // Tag occurrence or selection starts
          if(start === i || (occ && occ.start === i)){
            // We are opening a tag or a selection.
            if( insideTag || insideSelection ){
            
              if(!tag && occ && occ.start === i)
                tag = {start: i, attrs: occ.attrs};
              else if(!tag && start === i && !remove)
                tag = {start: i, attrs: attrs};

              // When inside a tag, and selection starts
              if(insideTag && start === i){
                // Tag started before selection
                if(occ.start < i){
                  tag.end = i;
                  tagReplacement.push(tag);
                  // We are removing, chop this tag and don't make a new one.
                  if(remove)
                    tag = null;
                  // Attributes are not same - shorten tag, and start a new one from selection
                  else if( !objectsAreSame(tag.attrs, attrs) )
                    tag = {start: i, attrs: attrs};
                }
                // Tag starts at the same position as selection
                else if( occ.start === i ){
                  // We are removing, kill this tag
                  if(remove)
                    tag = null;
                  // Otherwise just change it's attributes
                  else
                    tag.attrs = attrs;
                }
              }
              // When removing and inside selection and tag starts, destroy the tag. 
              // This happens for explicit removes, like the break-anchor action
              else if(remove && insideSelection && occ && occ.start === i)
                tag = null;
            }
          }

          // Tag occurrence or selection ends
          if(end === i || (occ && occ.end === i)){
            // Selection ended but we're still inside the tag
            if( insideTag ){
              // The selection removed a portion of the tag, we need to make it again
              if(remove)
                tag = {start: i, attrs: occ.attrs};
              // Attributes are the same - just extend the selection
              else if(objectsAreSame(occ.attrs, attrs)){
                tag.end = occ.end;
              }
              // Attributes are not same, end this tag here and start a new one based on what's left over
              else {
                tag.end = i;
                tagReplacement.push(tag);
                tag = {start: i, attrs: occ.attrs};
              }
            }
            // Tag ended but we're still in selection - do nothing, it will be handled on the next passes
            // We are outside any tags or selections, push tag and delete it - if there is a tag that is.
            else if(!insideSelection && tag){
              tag.end = i;
              tagReplacement.push(tag);
              tag = null;
            }
          }

          // If we're past the tag occurrence, get the next one
          if(occ && occ.end <= i)
            occ = taglist[j++];

          // Go to the next character. TODO: skip to important characters directly instead of incrementing.
          ++i;
        }
        finfo[wrapper] = tagReplacement;
      }
    
      this.textFormat(finfo);
      this.textSelection({start: start, length: sinfo.length});
      // We need to return selection info because we are storing it for later
      return sinfo;
    }
  });
})(jQuery);
