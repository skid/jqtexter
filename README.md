# jqTexter

jQTexter is a jQuery plugin for formatting text that works with character indexes so you don't have to deal with DOM selection and range objects. It evens out browser inconsistencies by working with elements' text contents instead of DOM Nodes.

Unlike some other editors out there, jQTexter's formatting attemps to optimally distribute tags. It will never leave tags of the same type next to each other or have tags overlap. For instance, if you have some bold text and later you add some italic tags inside, you will get this:

    <b>Some <i>italic</i> and some more <i>italic</i></b>

instead of this:

    <b>Some </b><i><b>italic</b></i><b> and some more </b><i><b>italic</b></i>
    
### Selection and formatting

Selections are described with a simple object like this:

    { start: 5, length: 15 }
    
Text formatting is described with list of simple objects like this:

    { B: [{start: 7, end: 33, attrs: {}}, {start: 65, end: 97, attrs: {}}],
      I: [{start: 87, end: 117, attrs: {}}, {start: 225, end: 245, attrs: {}}],
      A: [{start: 364, end: 397, attrs: {href: "http://example.com", target: "_blank"}}] }

### Methods

- `textSelection( [**selection**] )` gets/sets selection in an element
- `textFormat( [**formatting**, **replacementText**] )` gets/sets formatting in an element
- `applyTag( **selection**, **tagName**, [**attrs**, **remove**] )` applies (or removes) tagName to selection
- `getSelectedNodes()` returns a list of child nodes completely contained in selection

### Compatibility

jQtexter definitely works with IE 9+, Firefox 4+ and Chrome 12+. I'm not sure about other versions, but it requires the following APIs to be present:

- window.getSelection()
- selection.getRangeAt()
- selection.anchorNode, selection.focusNode
- HTML contentEditable attribute (required for actual editing)

### Demo / Project Page

[jQtexter at discobot](http://discobot.net/posts/jqtexter)

### License

[MIT](http://mit-license.org/)