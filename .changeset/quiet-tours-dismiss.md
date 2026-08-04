---
"@fluid-ds/components": patch
---

Dismiss a tour when a press lands outside its popover, the pointer equivalent
of the Escape it already handled. The scrim takes no pointer events so the
spotlit control stays usable, which also meant an outside press reached the
page underneath: a click on a link navigated away and left the coachmarks
anchored to a screen that was gone. The press is not swallowed, so it still
does whatever it normally would.

Add `renderOption` to the typeahead, so an option list fed as data can draw its
own rows. A slotted `fluid-option` has always been free to contain anything,
but options supplied as an array or from an async loader could only ever be a
string, leaving consumers to join fields into one label with separators. That
cannot right-align a value, cannot hold a checkbox, and reads as a single run
of text to a screen reader. The callback receives the index, the active and
selected state, the query, and the same highlighter the default row uses, since
a custom row usually still wants the match marked somewhere.
