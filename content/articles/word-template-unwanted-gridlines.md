---
id: word-template-unwanted-gridlines
title: 'Word: unwanted gridlines or borders appearing in a document'
constellation: files-storage
tags: [word, templates, formatting, gridlines, borders]
summary: A downloaded or opened Word document shows unexpected dotted lines, gridlines, or extra background
  borders that were not part of the original template.
stub: false
related: []
---

## Summary

A user opens a downloaded Word template and sees dotted lines, gridlines, or an
extra bordered background that does not appear in the original or in other
people's copies of the same file. Two distinct features cause this confusion:
actual paragraph/table borders (which print) and display-only gridlines (which
do not). The fix depends on which one is showing.

## Diagnostic Steps

1. Determine whether the lines appear in every document or only the downloaded
   template. If every document shows them, it is a global Word setting; if only
   one file, it is document-specific.
2. Distinguish gridlines from borders: go to the View tab and look for
   "Gridlines" in the Show group. If it is checked, the lines are likely
   display-only table gridlines.
3. Check whether the file was downloaded through a browser that may have
   modified it during the download — different browsers can occasionally
   alter Office file formatting, producing a corrupted or rearranged layout.

## Resolution Steps

1. If display gridlines are the cause: go to View → uncheck Gridlines. This
   hides table gridlines on screen; it does not affect printing.
2. If borders are the cause: go to Home → Paragraph group → click the Borders
   dropdown (dotted-square icon) → select No Borders. This removes actual
   printable borders from the selected paragraph or table.
3. If the document contains a hidden table used for layout: select the
   affected area, go to Table Design → Borders → No Border to strip the table
   borders while keeping the layout structure.
4. If the file itself appears corrupted (layout is rearranged, elements are
   shifted compared to a known-good copy): re-download the template using a
   different browser, or ask a colleague who has a working copy to share it.

## Notes / Edge Cases

- Gridlines are a view-only feature and never appear in print or in PDF
  exports. If the user's concern is about print output, the issue is borders,
  not gridlines.
- Many branded templates use single-cell tables with borders as alignment
  guides. These are intentional layout tools, not errors — removing the borders
  will flatten the template's structure.
- Browser download handlers, particularly on files opened inline rather than
  saved first, can occasionally mangle .docx formatting. Advising users to
  save the file directly (right-click → Save As) instead of opening it from
  the browser download bar can prevent this.
- Closure language if the issue is display gridlines: "The lines were
  display-only table gridlines, which do not appear in print. User toggled
  them off via View → Gridlines."
