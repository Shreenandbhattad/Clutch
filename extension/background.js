/* Clutch background service worker */

// Listen for extension icon click (fallback if popup fails)
chrome.action.onClicked.addListener(tab => {
  // This only fires if action.default_popup is not set.
  // With popup set, this won't fire — kept for completeness.
  chrome.tabs.create({ url: "hhttps://clutch-grab-what-you-like.netlify.app/app" });
});
