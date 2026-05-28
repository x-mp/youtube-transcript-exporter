const BUTTON_ROOT_CLASS = "yt-subtitle-download-root";
const BUTTON_CLASS = "yt-subtitle-download-button";
const STATUS_CLASS = "yt-subtitle-download-status";
const PANEL_SELECTORS = [
  'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]',
  'ytd-engagement-panel-section-list-renderer[target-id="PAmodern_transcript_view"]',
  'ytd-engagement-panel-section-list-renderer[visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"]'
].join(", ");

const state = {
  currentUrl: location.href,
  mountTimer: 0,
  isDownloading: false
};

const COPY = {
  en: {
    buttonLabel: "Export transcript",
    tooltip: "Export transcript",
    searching: "Looking for transcript...",
    downloaded: "Transcript downloaded",
    noTranscript: "No transcript is available for this video.",
    runtimeUnavailable: "Chrome runtime is not available for downloads.",
    serviceWorkerFailed: "The extension could not download the file.",
    captionFetchFailed: "YouTube did not return the transcript file.",
    metadataTitle: "Video metadata",
    videoId: "Video ID",
    title: "Title",
    author: "Author/channel",
    channelUrl: "Channel URL",
    channelId: "Channel ID",
    subscriberCount: "Subscribers",
    views: "Views",
    youtubeInfo: "YouTube info",
    duration: "Duration",
    publishDate: "Publish date",
    uploadDate: "Upload date",
    category: "Category",
    thumbnail: "Thumbnail",
    tags: "Tags",
    description: "Description",
    chapters: "Chapters",
    transcript: "Transcript"
  },
  ru: {
    buttonLabel: "Скачать расшифровку",
    tooltip: "Скачать расшифровку",
    searching: "Ищу расшифровку...",
    downloaded: "Расшифровка скачана",
    noTranscript: "Для этого видео нет доступной расшифровки.",
    runtimeUnavailable: "Chrome runtime недоступен для скачивания.",
    serviceWorkerFailed: "Расширение не смогло скачать файл.",
    captionFetchFailed: "YouTube не отдал файл расшифровки.",
    metadataTitle: "Метаданные видео",
    videoId: "ID видео",
    title: "Название",
    author: "Автор/канал",
    channelUrl: "Ссылка на канал",
    channelId: "ID канала",
    subscriberCount: "Подписчики",
    views: "Просмотры",
    youtubeInfo: "Информация YouTube",
    duration: "Длительность",
    publishDate: "Дата публикации",
    uploadDate: "Дата загрузки",
    category: "Категория",
    thumbnail: "Превью",
    tags: "Теги",
    description: "Описание",
    chapters: "Главы",
    transcript: "Расшифровка"
  }
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isWatchPage() {
  return location.pathname === "/watch" && Boolean(new URLSearchParams(location.search).get("v"));
}

function normalizeLanguageCode(language) {
  return String(language || "").toLowerCase().replace("_", "-").trim();
}

function getYouTubeInterfaceLanguage() {
  return (
    normalizeLanguageCode(document.documentElement.lang) ||
    normalizeLanguageCode(window.ytcfg?.data_?.HL) ||
    normalizeLanguageCode(window.yt?.config_?.HL) ||
    normalizeLanguageCode(navigator.language) ||
    "en"
  );
}

function getPreferredLanguages() {
  const interfaceLanguage = getYouTubeInterfaceLanguage();
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language || "en"];
  const languages = [interfaceLanguage, ...browserLanguages, "en"]
    .map(normalizeLanguageCode)
    .flatMap((language) => {
      const baseLanguage = language.split("-")[0];
      return language === baseLanguage ? [language] : [language, baseLanguage];
    })
    .filter(Boolean);

  return [...new Set(languages)];
}

function getCopy() {
  const language = getYouTubeInterfaceLanguage().split("-")[0];
  return COPY[language] || COPY.en;
}

function getVideoId() {
  return new URLSearchParams(location.search).get("v") || "youtube-video";
}

function getVideoTitle() {
  const title =
    document.querySelector("ytd-watch-metadata h1 yt-formatted-string")?.textContent?.trim() ||
    document.querySelector("h1.title yt-formatted-string")?.textContent?.trim() ||
    document.title.replace(/\s*-\s*YouTube\s*$/i, "").trim();

  return title || getVideoId();
}

function normalizeText(value) {
  return String(value || "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
}

function normalizeMultilineText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeFilename(value) {
  return value
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140) || getVideoId();
}

function parseTimestamp(timestamp) {
  const colonTime = timestamp.match(/\b\d{1,2}(?::\d{1,2}){1,2}\b/)?.[0] || "";
  if (!colonTime) {
    return parseSpokenTimestamp(timestamp);
  }

  const parts = colonTime.split(":").map((part) => Number(part.trim()));
  if (parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return null;
}

function parseSpokenTimestamp(value) {
  const normalized = value.toLowerCase();
  const hours = Number(normalized.match(/(\d+)\s*(?:час|hour)/)?.[1] || 0);
  const minutes = Number(normalized.match(/(\d+)\s*(?:минут|minute|min)/)?.[1] || 0);
  const seconds = Number(normalized.match(/(\d+)\s*(?:секунд|second|sec)/)?.[1] || 0);

  if (!hours && !minutes && !seconds) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

function formatTimestamp(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, rest].map((part) => String(part).padStart(2, "0")).join(":");
  }

  return [minutes, rest].map((part) => String(part).padStart(2, "0")).join(":");
}

function buildTranscriptText(segments) {
  return segments.map((segment) => `[${segment.timestampText}] ${segment.text}`).join("\n");
}

function getCanonicalVideoUrl() {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(getVideoId())}`;
}

function absoluteYouTubeUrl(path) {
  if (!path) {
    return "";
  }

  try {
    return new URL(path, "https://www.youtube.com").toString();
  } catch {
    return "";
  }
}

function getTextFromRuns(runs) {
  return Array.isArray(runs) ? runs.map((run) => run.text || "").join("") : "";
}

function getBestThumbnailUrl(thumbnails) {
  if (!Array.isArray(thumbnails) || !thumbnails.length) {
    return "";
  }

  return [...thumbnails].sort((left, right) => (right.width || 0) - (left.width || 0))[0]?.url || "";
}

function getMetadataFromPlayerResponse() {
  const response = getInitialPlayerResponse();
  const details = response?.videoDetails || {};
  const microformat = response?.microformat?.playerMicroformatRenderer || {};
  const durationSeconds = Number(details.lengthSeconds);
  const ownerProfileUrl = microformat.ownerProfileUrl || (
    details.authorExternalChannelId ? `/channel/${details.authorExternalChannelId}` : ""
  );

  return {
    title: details.title || getTextFromRuns(microformat.title?.runs) || microformat.title?.simpleText || "",
    videoId: details.videoId || getVideoId(),
    url: microformat.urlCanonical || getCanonicalVideoUrl(),
    author: details.author || microformat.ownerChannelName || "",
    channelId: details.channelId || details.authorExternalChannelId || microformat.externalChannelId || "",
    channelUrl: absoluteYouTubeUrl(ownerProfileUrl),
    duration: Number.isFinite(durationSeconds) ? formatTimestamp(durationSeconds) : "",
    views: microformat.viewCount || "",
    publishDate: microformat.publishDate || "",
    uploadDate: microformat.uploadDate || "",
    category: microformat.category || "",
    keywords: Array.isArray(details.keywords) ? details.keywords : [],
    thumbnailUrl: getBestThumbnailUrl(details.thumbnail?.thumbnails || microformat.thumbnail?.thumbnails),
    description: details.shortDescription || getTextFromRuns(microformat.description?.runs) || microformat.description?.simpleText || ""
  };
}

function getChaptersFromPage() {
  return [...document.querySelectorAll("ytd-macro-markers-list-item-renderer")]
    .map((node) => {
      const title = normalizeText(
        node.querySelector("h4.macro-markers:not([hidden])")?.textContent ||
        node.querySelector("h4[title]:not([hidden])")?.textContent ||
        ""
      );
      const time = normalizeText(node.querySelector("#time")?.textContent || "");

      if (!title || !time) {
        return null;
      }

      return `${time} ${title}`;
    })
    .filter(Boolean);
}

function getMetadataFromPage() {
  const watchMetadata = document.querySelector("ytd-watch-metadata");
  const channelLink =
    watchMetadata?.querySelector("#owner ytd-channel-name a[href]") ||
    watchMetadata?.querySelector("ytd-video-owner-renderer a[href]") ||
    null;
  const infoText =
    watchMetadata?.querySelector("ytd-watch-info-text #info")?.textContent ||
    watchMetadata?.querySelector("#info")?.textContent ||
    "";
  const description =
    watchMetadata?.querySelector("#description-inline-expander #expanded")?.textContent ||
    watchMetadata?.querySelector("#description-inline-expander #snippet")?.textContent ||
    watchMetadata?.querySelector("#description")?.textContent ||
    "";

  return {
    title: getVideoTitle(),
    videoId: watchMetadata?.getAttribute("video-id") || getVideoId(),
    url: getCanonicalVideoUrl(),
    author: normalizeText(
      watchMetadata?.querySelector("#owner #channel-name a")?.textContent ||
      watchMetadata?.querySelector("#owner #channel-name")?.textContent ||
      document.querySelector(".ytp-title-channel-name")?.textContent ||
      ""
    ),
    channelUrl: absoluteYouTubeUrl(channelLink?.getAttribute("href") || ""),
    subscriberCount: normalizeText(watchMetadata?.querySelector("#owner-sub-count")?.textContent || ""),
    info: normalizeText(infoText),
    chapters: getChaptersFromPage(),
    description: normalizeMultilineText(description.replace(/\.\.\.ещё|\.\.\.more/gi, ""))
  };
}

function mergeVideoMetadata() {
  const fromResponse = getMetadataFromPlayerResponse();
  const fromPage = getMetadataFromPage();
  return {
    ...fromResponse,
    ...Object.fromEntries(Object.entries(fromPage).filter(([, value]) => Boolean(value))),
    chapters: fromPage.chapters?.length ? fromPage.chapters : [],
    description: normalizeMultilineText(fromResponse.description || fromPage.description)
  };
}

function buildMetadataText(metadata) {
  const copy = getCopy();
  const lines = [
    `=== ${copy.metadataTitle} ===`,
    `URL: ${metadata.url || getCanonicalVideoUrl()}`,
    `${copy.videoId}: ${metadata.videoId || getVideoId()}`,
    `${copy.title}: ${metadata.title || getVideoTitle()}`
  ];

  if (metadata.author) lines.push(`${copy.author}: ${metadata.author}`);
  if (metadata.channelUrl) lines.push(`${copy.channelUrl}: ${metadata.channelUrl}`);
  if (metadata.channelId) lines.push(`${copy.channelId}: ${metadata.channelId}`);
  if (metadata.subscriberCount) lines.push(`${copy.subscriberCount}: ${metadata.subscriberCount}`);
  if (metadata.views) lines.push(`${copy.views}: ${metadata.views}`);
  if (metadata.info) lines.push(`${copy.youtubeInfo}: ${metadata.info}`);
  if (metadata.duration) lines.push(`${copy.duration}: ${metadata.duration}`);
  if (metadata.publishDate) lines.push(`${copy.publishDate}: ${metadata.publishDate}`);
  if (metadata.uploadDate) lines.push(`${copy.uploadDate}: ${metadata.uploadDate}`);
  if (metadata.category) lines.push(`${copy.category}: ${metadata.category}`);
  if (metadata.thumbnailUrl) lines.push(`${copy.thumbnail}: ${metadata.thumbnailUrl}`);
  if (metadata.keywords?.length) lines.push(`${copy.tags}: ${metadata.keywords.join(", ")}`);

  if (metadata.description) {
    lines.push("", `=== ${copy.description} ===`, metadata.description);
  }

  if (metadata.chapters?.length) {
    lines.push("", `=== ${copy.chapters} ===`, ...metadata.chapters);
  }

  return lines.join("\n");
}

function buildDownloadText(metadata, segments) {
  return `${buildMetadataText(metadata)}\n\n=== ${getCopy().transcript} ===\n${buildTranscriptText(segments)}`;
}

function getTopLevelButtons() {
  return (
    document.querySelector("ytd-watch-metadata ytd-menu-renderer #top-level-buttons-computed") ||
    document.querySelector("ytd-watch-metadata ytd-menu-renderer #flexible-item-buttons") ||
    document.querySelector("ytd-watch-metadata #actions-inner") ||
    document.querySelector("ytd-watch-metadata #actions") ||
    null
  );
}

function getLikeControl(anchor) {
  return (
    anchor.querySelector("segmented-like-dislike-button-view-model") ||
    anchor.querySelector("ytd-segmented-like-dislike-button-renderer") ||
    anchor.querySelector("like-button-view-model") ||
    anchor.firstElementChild
  );
}

function setStatus(root, message, isError = false) {
  const status = root?.querySelector(`.${STATUS_CLASS}`);
  if (!status) {
    return;
  }

  status.textContent = message;
  status.dataset.state = isError ? "error" : "default";
  status.hidden = !message;

  if (message) {
    window.clearTimeout(Number(status.dataset.timer || 0));
    status.dataset.timer = String(window.setTimeout(() => {
      status.hidden = true;
      status.textContent = "";
    }, isError ? 4500 : 2500));
  }
}

function setButtonLoading(button, isLoading) {
  button.disabled = isLoading;
  button.setAttribute("aria-busy", String(isLoading));
  button.classList.toggle("is-loading", isLoading);
}

function createButtonRoot() {
  const copy = getCopy();
  const root = document.createElement("div");
  root.className = BUTTON_ROOT_CLASS;
  root.dataset.tooltip = copy.tooltip;
  root.innerHTML = `
    <button class="${BUTTON_CLASS}" type="button" aria-label="${copy.buttonLabel}">
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M6.75 3A2.75 2.75 0 0 0 4 5.75v8.5A2.75 2.75 0 0 0 6.75 17H10a.75.75 0 0 0 0-1.5H6.75c-.69 0-1.25-.56-1.25-1.25v-8.5c0-.69.56-1.25 1.25-1.25h10.5c.69 0 1.25.56 1.25 1.25v8.5c0 .69-.56 1.25-1.25 1.25H14a.75.75 0 0 0 0 1.5h3.25A2.75 2.75 0 0 0 20 14.25v-8.5A2.75 2.75 0 0 0 17.25 3H6.75Z"></path>
        <path d="M7.75 8.25h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1 0-1.5Zm6 0h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1 0-1.5Zm-6 3.5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Z"></path>
        <path d="M12 14.25a.75.75 0 0 1 .75.75v4.19l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06l1.72 1.72V15a.75.75 0 0 1 .75-.75Z"></path>
      </svg>
    </button>
    <div class="${STATUS_CLASS}" hidden></div>
  `;

  root.querySelector(`.${BUTTON_CLASS}`).addEventListener("click", handleDownloadClick);
  return root;
}

function mountButton() {
  if (!isWatchPage()) {
    document.querySelectorAll(`.${BUTTON_ROOT_CLASS}`).forEach((node) => node.remove());
    return;
  }

  const anchor = getTopLevelButtons();
  if (!anchor) {
    return;
  }

  const existingRoots = Array.from(document.querySelectorAll(`.${BUTTON_ROOT_CLASS}`));
  let root = existingRoots.find((node) => anchor.contains(node)) || existingRoots[0] || null;

  existingRoots.forEach((node) => {
    if (node !== root) {
      node.remove();
    }
  });

  if (!root) {
    root = createButtonRoot();
  }

  const copy = getCopy();
  root.dataset.tooltip = copy.tooltip;
  root.querySelector(`.${BUTTON_CLASS}`)?.setAttribute("aria-label", copy.buttonLabel);

  const likeControl = getLikeControl(anchor);
  if (root.nextElementSibling !== likeControl) {
    anchor.insertBefore(root, likeControl || anchor.firstChild);
  }
}

function scheduleMount() {
  window.clearTimeout(state.mountTimer);
  state.mountTimer = window.setTimeout(mountButton, 250);
}

function extractBalancedObject(source, startIndex) {
  const openIndex = source.indexOf("{", startIndex);
  if (openIndex === -1) {
    return "";
  }

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openIndex, index + 1);
      }
    }
  }

  return "";
}

function getInitialPlayerResponse() {
  const playerElement = document.querySelector("#movie_player");
  const playerResponse = playerElement?.getPlayerResponse?.();
  if (playerResponse?.captions) {
    return playerResponse;
  }

  for (const script of document.scripts) {
    const text = script.textContent || "";
    const markerIndex = text.indexOf("ytInitialPlayerResponse");
    if (markerIndex === -1) {
      continue;
    }

    const objectText = extractBalancedObject(text, markerIndex);
    if (!objectText) {
      continue;
    }

    try {
      return JSON.parse(objectText);
    } catch {
      continue;
    }
  }

  return null;
}

function getCaptionTracks() {
  const response = getInitialPlayerResponse();
  return response?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
}

function chooseCaptionTrack(tracks) {
  if (!tracks.length) {
    return null;
  }

  const preferredLanguages = getPreferredLanguages();

  const manualTracks = tracks.filter((track) => track.kind !== "asr");
  const candidates = manualTracks.length ? manualTracks : tracks;

  for (const language of preferredLanguages) {
    const track = candidates.find((item) => item.languageCode?.toLowerCase().startsWith(language));
    if (track) {
      return track;
    }
  }

  return candidates[0];
}

function decodeHtmlEntities(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function parseJson3Transcript(payload) {
  const events = Array.isArray(payload.events) ? payload.events : [];
  return events
    .map((event) => {
      const text = (event.segs || [])
        .map((segment) => segment.utf8 || "")
        .join("")
        .replace(/\s+/g, " ")
        .trim();

      if (!text || !Number.isFinite(event.tStartMs)) {
        return null;
      }

      const seconds = event.tStartMs / 1000;
      return {
        timestampText: formatTimestamp(seconds),
        seconds,
        text
      };
    })
    .filter(Boolean);
}

function parseXmlTranscript(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  return [...doc.querySelectorAll("text")]
    .map((node) => {
      const seconds = Number(node.getAttribute("start"));
      const text = decodeHtmlEntities(node.textContent || "").replace(/\s+/g, " ").trim();

      if (!Number.isFinite(seconds) || !text) {
        return null;
      }

      return {
        timestampText: formatTimestamp(seconds),
        seconds,
        text
      };
    })
    .filter(Boolean);
}

async function fetchTranscriptFromCaptionTrack(track) {
  const jsonUrl = new URL(track.baseUrl);
  jsonUrl.searchParams.set("fmt", "json3");

  try {
    const jsonResponse = await fetch(jsonUrl.toString(), { credentials: "include" });
    if (jsonResponse.ok) {
      const payload = await jsonResponse.json();
      const segments = parseJson3Transcript(payload);
      if (segments.length) {
        return segments;
      }
    }
  } catch {
    // Some YouTube responses reject json3 caption fetches. XML and DOM fallbacks handle it.
  }

  const xmlUrl = new URL(track.baseUrl);
  xmlUrl.searchParams.delete("fmt");
  const xmlResponse = await fetch(xmlUrl.toString(), { credentials: "include" });
  if (!xmlResponse.ok) {
    throw new Error(getCopy().captionFetchFailed);
  }

  return parseXmlTranscript(await xmlResponse.text());
}

function getTranscriptEntrySection() {
  return document.querySelector("ytd-video-description-transcript-section-renderer");
}

function getTranscriptOpenButton() {
  const section = getTranscriptEntrySection();
  if (!section) {
    return null;
  }

  return (
    section.querySelector("#button-container button") ||
    [...section.querySelectorAll("button")].find((button) =>
      /показать текст видео|show transcript|show video transcript/i.test(
        `${button.textContent || ""} ${button.getAttribute("aria-label") || ""}`
      )
    ) ||
    null
  );
}

function getTranscriptPanel() {
  const panels = [...document.querySelectorAll(PANEL_SELECTORS)];
  return panels.find((panel) => panel.querySelector("ytd-transcript-renderer")) || panels.find((panel) => {
    const visibility = panel.getAttribute("visibility");
    const hasTranscriptTitle = /расшифровк|transcript/i.test(panel.textContent || "");
    return visibility !== "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN" && hasTranscriptTitle;
  }) || null;
}

function getSegmentTimestampText(node) {
  return (
    node.querySelector(".ytwTranscriptSegmentViewModelTimestamp")?.textContent?.trim() ||
    node.querySelector('[class*="TranscriptSegmentViewModelTimestamp"]')?.textContent?.trim() ||
    node.querySelector("#segment-timestamp")?.textContent?.trim() ||
    node.querySelector(".segment-timestamp")?.textContent?.trim() ||
    node.querySelector(".segment-start-offset")?.textContent?.trim() ||
    ""
  );
}

function getSegmentText(node) {
  return (
    node.querySelector(".segment-text")?.textContent?.trim() ||
    node.querySelector('[class*="TranscriptSegmentViewModelSegment"]')?.textContent?.trim() ||
    node.querySelector('.ytAttributedStringHost[role="text"]')?.textContent?.trim() ||
    node.querySelector('span[role="text"]')?.textContent?.trim() ||
    node.querySelector('.yt-core-attributed-string[role="text"]')?.textContent?.trim() ||
    node.querySelector("#segment-text")?.textContent?.trim() ||
    node.querySelector("yt-formatted-string")?.textContent?.trim() ||
    ""
  );
}

function getSegmentAriaLabel(node) {
  return node.querySelector("[aria-label]")?.getAttribute("aria-label") || node.getAttribute("aria-label") || "";
}

function getSegmentFromAriaLabel(label) {
  if (!label) {
    return "";
  }

  return label
    .replace(/^\s*(?:\d+\s*(?:час(?:а|ов)?|hour(?:s)?)\s*)?/i, "")
    .replace(/^\s*(?:\d+\s*(?:минут(?:а|ы)?|minute(?:s)?|min)\s*)?/i, "")
    .replace(/^\s*(?:\d+\s*(?:секунд(?:а|ы)?|second(?:s)?|sec)\s*)?/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getTranscriptSegments(panel) {
  const nodes = panel.querySelectorAll(
    [
      "transcript-segment-view-model",
      ".ytwTranscriptSegmentViewModelHost",
      "ytd-transcript-segment-renderer"
    ].join(", ")
  );

  const seen = new Set();
  const segments = [];

  nodes.forEach((node) => {
    const rawTimestampText = getSegmentTimestampText(node);
    const ariaLabel = getSegmentAriaLabel(node);
    const seconds = parseTimestamp(rawTimestampText) ?? parseTimestamp(ariaLabel);
    const timestampText = seconds === null ? rawTimestampText : rawTimestampText || formatTimestamp(seconds);
    const text = getSegmentText(node) || getSegmentFromAriaLabel(ariaLabel);
    const normalizedText = text.replace(/\s+/g, " ").trim();
    if (seconds === null || !normalizedText) {
      return;
    }

    const key = `${timestampText}__${normalizedText}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    segments.push({
      timestampText,
      seconds,
      text: normalizedText
    });
  });

  return segments.sort((left, right) => left.seconds - right.seconds);
}

async function waitForTranscriptSegments(timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const panel = getTranscriptPanel();
    if (panel) {
      const segments = getTranscriptSegments(panel);
      if (segments.length) {
        return segments;
      }
    }

    await sleep(300);
  }

  return [];
}

async function getTranscriptSegmentsForCurrentVideo() {
  const tracks = getCaptionTracks();
  const track = chooseCaptionTrack(tracks);
  if (track) {
    try {
      const segments = await fetchTranscriptFromCaptionTrack(track);
      if (segments.length) {
        return segments;
      }
    } catch {
      // Fall back to the transcript panel when direct caption URLs are unavailable.
    }
  }

  const currentPanel = getTranscriptPanel();
  let segments = currentPanel ? getTranscriptSegments(currentPanel) : [];
  if (segments.length) {
    return segments;
  }

  const openButton = getTranscriptOpenButton();
  if (openButton) {
    openButton.click();
    await sleep(500);
  }

  segments = await waitForTranscriptSegments();
  if (!segments.length) {
    throw new Error(getCopy().noTranscript);
  }

  return segments;
}

function downloadTextFile(filename, content) {
  return new Promise((resolve, reject) => {
    if (!chrome?.runtime?.sendMessage) {
      reject(new Error(getCopy().runtimeUnavailable));
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: "YT_SUBTITLE_DOWNLOAD",
        filename,
        content
      },
      (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }

        if (!response?.ok) {
          reject(new Error(response?.error || getCopy().serviceWorkerFailed));
          return;
        }

        resolve(response);
      }
    );
  });
}

async function handleDownloadClick(event) {
  const button = event.currentTarget;
  const root = button.closest(`.${BUTTON_ROOT_CLASS}`);

  if (state.isDownloading) {
    return;
  }

  state.isDownloading = true;
  setButtonLoading(button, true);
  setStatus(root, getCopy().searching);

  try {
    const segments = await getTranscriptSegmentsForCurrentVideo();
    const metadata = mergeVideoMetadata();
    const title = sanitizeFilename(metadata.title || getVideoTitle());
    await downloadTextFile(`${title} - subtitles.txt`, buildDownloadText(metadata, segments));
    setStatus(root, getCopy().downloaded);
  } catch (error) {
    setStatus(root, error.message || getCopy().serviceWorkerFailed, true);
  } finally {
    state.isDownloading = false;
    setButtonLoading(button, false);
  }
}

function handleNavigation() {
  if (state.currentUrl === location.href) {
    return;
  }

  state.currentUrl = location.href;
  document.querySelectorAll(`.${BUTTON_ROOT_CLASS}`).forEach((node) => node.remove());
  scheduleMount();
}

const observer = new MutationObserver(() => {
  handleNavigation();
  scheduleMount();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

window.addEventListener("yt-navigate-finish", () => {
  handleNavigation();
  scheduleMount();
});

scheduleMount();
