function sendError(sendResponse, error) {
  const message = error?.message || String(error || "Unknown error");
  sendResponse({ ok: false, error: message });
}

function makeDataUrl(content) {
  const bytes = new TextEncoder().encode(content);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return `data:text/plain;charset=utf-8;base64,${btoa(binary)}`;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "YT_SUBTITLE_DOWNLOAD") {
    return false;
  }

  const filename = String(message.filename || "youtube-subtitles.txt");
  const content = String(message.content || "");

  if (!content.trim()) {
    sendError(sendResponse, new Error("The transcript file is empty."));
    return false;
  }

  chrome.downloads.download(
    {
      url: makeDataUrl(content),
      filename,
      saveAs: false,
      conflictAction: "uniquify"
    },
    (downloadId) => {
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        sendError(sendResponse, runtimeError);
        return;
      }

      sendResponse({ ok: true, downloadId });
    }
  );

  return true;
});
