// A browser window around a page that plays an app, so it reads as the app itself.
// The title bar is decoration: traffic lights and the app's real address. Styled in shell.css.

const LOCK = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M5.5 9h9v7.5h-9zM7.5 9V6.5a2.5 2.5 0 0 1 5 0V9"/></svg>';

export const browserWindow = (address, inner) => `<div class="bw">
<div class="bw-bar" aria-hidden="true"><span class="bw-dots"><span></span><span></span><span></span></span><span class="bw-url">${LOCK}${address}</span></div>
<div class="bw-view">
${inner}
</div>
</div>`;
