# YouTube Transcript Exporter

YouTube Transcript Exporter adds a compact button to YouTube watch pages and saves the current video's transcript as a `.txt` file.

The extension is prepared for a free English-language Chrome Web Store listing. It uses the YouTube/browser interface language to choose the best available transcript track and localizes the exported TXT headings for English and Russian interfaces.

Chrome Web Store publication settings:

- Item language: English
- Category: Productivity
- Pricing: Free
- Language behavior: interface-language aware transcript selection when YouTube provides matching caption tracks
- Public repository: https://github.com/x-mp/youtube-transcript-exporter
- Privacy policy URL: https://raw.githubusercontent.com/x-mp/youtube-transcript-exporter/main/PRIVACY.md

The exported file includes:

- Video URL and ID
- Title
- Channel name and channel URL
- Subscriber count when visible
- Views, publish/upload dates, duration, category, thumbnail, and tags when available
- Description
- Chapters when YouTube shows them
- Timestamped transcript lines

## Usage

1. Open a YouTube video page.
2. Click the transcript export button near the YouTube action buttons.
3. The extension downloads a text file named after the video title.

If YouTube does not expose direct caption data, the extension opens or reads the visible transcript panel and exports the transcript from the page.

## Privacy

The extension runs only on `youtube.com`, reads video metadata/transcript text from the current YouTube page, and creates a local text download through the Chrome Downloads API.

It does not collect, store, sell, or transmit user data to any external server.

This extension is an independent tool and is not affiliated with, endorsed by, or sponsored by YouTube or Google.

## Local Development

Load the folder as an unpacked extension:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked**.
4. Select this project folder.

## Release

Run:

```bash
./build-release.sh
```

Upload the ZIP file in `dist/` to Chrome Web Store. The package name is derived from `manifest.json`.

Store listing materials are in `store-assets/`:

- `listing.md` - title, descriptions, permission justifications, privacy answers, and reviewer test instructions
- `submission-checklist.md` - dashboard checklist
- `store-icon-128x128.png` - required Store icon upload
- `screenshot-1-main-1280x800.png` - required screenshot
- `promo-small-440x280.png` - required small promo image
- `promo-marquee-1400x560.png` - optional marquee promo image

Do not include local debug files in the submitted package.
