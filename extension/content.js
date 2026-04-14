/* Clutch content script — extracts page metadata */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "GET_META") return;

  const description =
    document.querySelector('meta[name="description"]')?.getAttribute("content") ||
    document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
    document.querySelector('meta[name="twitter:description"]')?.getAttribute("content") ||
    "";

  const image =
    document.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
    document.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ||
    "";

  const siteName =
    document.querySelector('meta[property="og:site_name"]')?.getAttribute("content") ||
    "";

  const canonicalTitle =
    document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
    document.querySelector('meta[name="twitter:title"]')?.getAttribute("content") ||
    document.title ||
    "";

  sendResponse({ description, image, siteName, canonicalTitle });
  return true;
});
