# Custom weapon cursors

Drop the four files below into this directory. Recommended: 32x32 PNGs with
transparent background and the "tip" of the weapon near the center
(hot-spot is set to 16,16 in CSS).

- gun.png
- fist.png
- heart.png
- sword.png

If a file is missing the cursor falls back to `crosshair` automatically.

If you also want to swap out the photo at the center of /fun, drop your image
at `/public/fun/photo.jpg` (or .png) and update the `PHOTO_SRC` constant
near the top of `components/FunPage.tsx`.
