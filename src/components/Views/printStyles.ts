/**
 * Shared print rules for the app's printable documents.
 *
 * Extracted so the vet report and the sitter sheet cannot drift apart. Both
 * are dark on screen and must be black on white on paper, and getting there
 * takes three things that are easy to miss individually:
 *
 *   1. The app shell prints. Scoping styles to the document leaves the header,
 *      nav and footer on the page, so everything is hidden and only the
 *      document is shown back. That works without knowing the shell's markup.
 *   2. `transparent` is not enough. The dark ground is painted by an ancestor,
 *      so html/body and every element inside the document are forced white.
 *   3. Colour carries meaning. Severity and urgency are encoded in colour on
 *      screen, which monochrome flattens — weight and border style carry it
 *      on paper instead.
 *
 * Any printable view opts in by putting `report-root` on its outer element and
 * `no-print` on anything that is screen-only.
 */
export const PRINT_STYLES = `
@media print {
  /* Establish a light context first so inherited colours resolve correctly. */
  :root, html, body {
    background: #fff !important;
    color: #000 !important;
    color-scheme: light !important;
  }

  /* Print the document and nothing else. */
  body * { visibility: hidden !important; }
  .report-root, .report-root * { visibility: visible !important; }
  .report-root {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .no-print, .no-print * { display: none !important; }

  /* Backgrounds are forced white rather than transparent so a dark card cannot
     survive when the browser is set to print background graphics. */
  .report-root *,
  .report-root *::before,
  .report-root *::after {
    background: #fff !important;
    background-image: none !important;
    color: #000 !important;
    box-shadow: none !important;
    text-shadow: none !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .report-root svg {
    color: #000 !important;
    stroke: #000 !important;
    fill: none !important;
  }

  .report-section,
  .report-header {
    border: 1px solid #999 !important;
    border-radius: 0 !important;
    page-break-inside: avoid;
    break-inside: avoid;
    margin: 0 0 10pt 0 !important;
    padding: 10pt !important;
  }

  /* Chips lose their fill, so they need an outline to still read as labels
     rather than words floating at the end of a line. */
  .report-root .rounded-full {
    border: 1pt solid #000 !important;
    border-radius: 999px !important;
    padding: 0 5pt !important;
  }

  .report-concern,
  .report-visit,
  .report-finding {
    page-break-inside: avoid;
    break-inside: avoid;
    border-radius: 0 !important;
    padding-left: 8pt !important;
  }

  /* Rule weight replaces colour as the severity signal. */
  [data-severity="urgent"] { border-left: 4pt solid #000 !important; }
  [data-severity="watch"]  { border-left: 2pt solid #000 !important; }
  [data-severity="note"]   { border-left: 1pt dashed #555 !important; }
  .report-visit            { border-left: 1pt solid #999 !important; }

  /* A sitter ticks these by hand, so they must survive losing their fill. */
  .print-checkbox {
    border: 1pt solid #000 !important;
    border-radius: 2pt !important;
    width: 11pt !important;
    height: 11pt !important;
    display: inline-block !important;
  }

  /* One day per block, never split across a page boundary. */
  .sitter-day {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .report-footer {
    border-top: 1px solid #999;
    padding-top: 6pt;
  }

  h1 { font-size: 18pt !important; }
  h2 { font-size: 10pt !important; }
  h1, h2, h3 { page-break-after: avoid; }

  @page { margin: 14mm; }
}
`;
