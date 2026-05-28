# Chrome Web Store Submission Checklist

## Package

- [ ] Run `./build-release.sh`.
- [ ] Upload `dist/youtube-transcript-exporter-1.1.0.zip` in Chrome Developer Dashboard.
- [ ] Confirm `manifest.json` version is higher than the previously published version.
- [ ] Public repository: `https://github.com/x-mp/youtube-transcript-exporter`.

## Manual QA

- [ ] Load the unpacked extension in Chrome.
- [ ] Test at least 3 YouTube videos with transcripts.
- [ ] Test a video where the transcript panel is closed.
- [ ] Test a video where the transcript panel is already open.
- [ ] Test a video without available transcript and confirm the error message is clear.
- [ ] Test with YouTube/Chrome interface set to English.
- [ ] Test with another interface language and confirm the export labels/caption choice follow the interface when possible.

## Listing

- [ ] Item language: English.
- [ ] Language note: listing is English; extension chooses transcript tracks based on YouTube/browser interface language when possible.
- [ ] Category: Productivity.
- [ ] Category rationale: research, note-taking, summarization, content review, and transcript archiving.
- [ ] Pricing: Free.
- [ ] Single purpose: use the text from `store-assets/listing.md`.
- [ ] Permission justification: use the `downloads` text from `store-assets/listing.md`.
- [ ] Host access justification: use the YouTube host access text from `store-assets/listing.md`.
- [ ] Test instructions: use the review instructions from `store-assets/listing.md`.
- [ ] Privacy policy URL: `https://raw.githubusercontent.com/x-mp/youtube-transcript-exporter/main/PRIVACY.md`.
- [ ] Optional nicer URL: enable GitHub Pages from `main` / `docs`, then use `https://x-mp.github.io/youtube-transcript-exporter/privacy.html`.

## Graphics

- [ ] Upload `store-assets/store-icon-128x128.png` as the Store icon.
- [ ] Confirm Store icon is accepted as 128x128 PNG and follows image guidelines.
- [ ] Upload `store-assets/screenshot-1-main-1280x800.png` as the required screenshot.
- [ ] Upload `store-assets/promo-small-440x280.png` as the required small promo tile.
- [ ] Upload `store-assets/promo-marquee-1400x560.png` as the optional marquee promo tile.

## Privacy

- [ ] Declare Website content access only.
- [ ] Confirm no data sale, no third-party transfer, no unrelated use, no creditworthiness use.
- [ ] Confirm the extension does not collect analytics, personal data, or browsing history.

## Final

- [ ] Submit for review.
- [ ] Save the submitted version number, date, and package filename in release notes.
