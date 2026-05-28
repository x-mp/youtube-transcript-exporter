# Chrome Web Store Listing

## Public Repository

https://github.com/x-mp/youtube-transcript-exporter

## Privacy Policy URL

Use this URL in the Chrome Web Store Privacy tab:

https://raw.githubusercontent.com/x-mp/youtube-transcript-exporter/main/PRIVACY.md

Optional nicer GitHub Pages URL after enabling Pages from `main` / `docs`:

https://x-mp.github.io/youtube-transcript-exporter/privacy.html

## Item Language

English

Use **English** as the primary Chrome Web Store item language because the listing, screenshots, promotional images, and default extension copy are prepared for an international English-speaking audience.

## Supported Interface And Transcript Languages

Primary listing language: English.

Extension UI/export headings:

- English by default.
- Russian when the YouTube/browser interface language is Russian.

Transcript selection behavior:

- The extension checks the current YouTube page language and browser language preferences.
- It tries to select the best matching YouTube caption/transcript track.
- If the exact interface language is not available for the video, it falls back to the closest available transcript track, then English when available.

Suggested dashboard note if a language/support field is available:

> The Chrome Web Store listing is in English. The extension is interface-language aware and attempts to export the transcript track that best matches the user's YouTube/browser language when that transcript is available on YouTube.

## Name

YouTube Transcript Exporter

## Short Description

Export YouTube transcripts with timestamps and video metadata as a TXT file.

## Detailed Description

YouTube Transcript Exporter adds a compact export button to YouTube video pages. Click it to download a clean `.txt` file with the video's transcript and useful context from the page.

What the export can include:

- Transcript lines with timestamps
- Video title, URL, and video ID
- Channel name and channel URL
- Views, publish date, upload date, duration, category, tags, and thumbnail URL when available
- Video description
- Chapters when YouTube shows them

The extension follows the current YouTube/browser interface language when choosing the best available caption track. If an exact language match is unavailable, it falls back to the closest available transcript.

Good for research, note-taking, summaries, content review, quote checking, and archiving video context in a simple text format.

Privacy-first behavior:

- Free to use
- No account required
- No external server
- No analytics
- No ads
- No tracking
- No collected data

The extension reads the current YouTube page only when you request an export. The generated file is saved locally through Chrome's Downloads API.

This extension is an independent tool and is not affiliated with, endorsed by, or sponsored by YouTube or Google.

## Category

Productivity

Recommended Chrome Web Store category: **Productivity**.

Reason: the extension helps users save transcripts and video context for research, note-taking, summarization, review, and archiving. It is not a media downloader, entertainment app, or developer tool.

Suggested category explanation:

> Productivity: helps users turn YouTube video transcripts and metadata into local text files for research, notes, content review, and knowledge workflows.

## Single Purpose

Export the transcript and visible metadata from the current YouTube video page into a local text file.

## Permission Justification

### downloads

Required to save the generated transcript and video metadata as a local `.txt` file when the user clicks the export button.

## Host Access Justification

The extension runs on YouTube watch pages to read the current video's transcript and visible metadata from the page. It does not run on unrelated websites.

## Privacy Dashboard Answers

Suggested user data declaration:

- Website content: Yes. The extension reads YouTube page content such as transcript text, title, channel, description, and visible metadata to create the export file requested by the user.
- Personally identifiable information: No
- Authentication information: No
- Financial and payment information: No
- Health information: No
- Personal communications: No
- Location: No
- Web history: No. The extension does not collect or transmit browsing history. It only reads the active YouTube page for the user-requested export.
- User activity: No tracking or analytics.

Data handling:

- Data is not sold.
- Data is not used for unrelated purposes.
- Data is not used for creditworthiness or lending.
- Data is not transferred to third parties.
- Data is not transmitted to external servers.

## Test Instructions For Review

1. Install the extension.
2. Open any YouTube video with an available transcript.
3. Click the transcript export button near the video action buttons.
4. Confirm that a `.txt` file downloads.
5. Open the file and verify that it contains video metadata, description, and timestamped transcript lines.

If the transcript panel is not already open, the extension may open it automatically before exporting.

## Store Assets

Required:

- Store icon: `store-assets/store-icon-128x128.png`
- Screenshot: `store-assets/screenshot-1-main-1280x800.png`
- Small promotional image: `store-assets/promo-small-440x280.png`

Optional:

- Marquee promotional image: `store-assets/promo-marquee-1400x560.png`

Generated SVG sources are kept next to the PNG files so the assets can be edited and regenerated.

## Store Icon

Upload: `store-assets/store-icon-128x128.png`

Requirements covered:

- PNG
- 128x128 pixels
- Same visual identity as the extension package icon
- Icon artwork is centered with padding so it is not cropped in Chrome Web Store surfaces
- No text inside the icon
- Simple high-contrast mark that remains readable at small sizes
