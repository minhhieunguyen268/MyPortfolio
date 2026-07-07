# Porpolio (Portfolio)

Portfolio 1 trang (HTML/CSS/JS), responsive, co animation nhe, va dang duoc canh chinh theo CV moi cua Nguyen Minh Hieu.

Hieu ung/tuong tac:
- Thanh tien do cuon (top progress bar)
- Tilt + shine nhe tren card khi hover
- Scroll reveal + scroll-spy cho menu
- Mobile menu mo/dong muot

## Chay local

Mo truc tiep `index.html` van xem duoc, nhung de on dinh (fonts, anchor, cache) nen dung server nho:

- Neu may co Python:
  - Windows: `py -m http.server 5173`
  - Mac/Linux: `python3 -m http.server 5173`
- Hoac Node:
  - `npx serve .`

Sau do mo `http://localhost:5173`.

## Tuy bien nhanh

Sua trong `index.html`:

- Doi email/phone neu can.
- Doi link `CV (PDF)` neu thay file khac.
- CV dang duoc link o `assets/cv.pdf`.
- Avatar logo dang doc tu `assets/ironavt.jpg`.

Du an:

- Sua data trong the `<script type="application/json" id="projectsData"> ... </script>` (cuoi file `index.html`).
- Neu muon an nut link nao: de `"#"` hoac xoa field tuong ung.

## Files

- `index.html`: noi dung + sections (Hero/About/Projects/Experience/Skills/Contact)
- `styles.css`: theme, layout, responsive, focus ring, animations
- `app.js`: render projects, copy email, reveal on scroll, scroll-spy, mobile nav
- `assets/favicon.svg`: favicon
- `assets/cv.pdf`: CV PDF

## Lay text tu CV (optional)

- Script OCR: `scripts/extract_cv_ocr.ps1`
- Output: `cv_ocr.txt`

## Accessibility

- Neu he dieu hanh bat "Reduce motion", cac hieu ung se tu dong giam/tat.
