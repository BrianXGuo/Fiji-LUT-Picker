# LUT Picker (Fiji / ImageJ)

A Fiji (ImageJ) JavaScript plugin that helps you quickly **browse, search, preview, and apply LUTs** (Look-Up Tables) to the current image.

## Features

- Thumbnail preview of each LUT
- Multi-column layout for faster browsing
- Instant search/filter
- One-click apply to the current image

---

## Installation (Fiji)

1. Download `LUT_Picker.js`.
2. Copy `LUT_Picker.js` into your Fiji installation folder:

   **Option A (recommended):**
   - `Fiji.app/plugins/`

   **Option B (also works in many setups):**
   - `Fiji.app/scripts/Plugins/`

3. Restart Fiji.
4. Run the plugin from the menu:
   - `Plugins > LUT Picker`  
   (The exact menu location can vary slightly depending on your Fiji setup.)

---

## LUT Folder (Where LUT files are loaded from)

By default, the plugin looks for LUT files in this folder:

- `Fiji.app/luts/`

That is, it uses:

```js
var lutFolderName = "luts";
```

and loads LUTs from:

```
IJ.getDirectory("imagej") + lutFolderName
```

---

## How to Use a Custom LUT Folder

If you want to store your LUTs in a different folder (for example `luts_custom`):

### Step 1 — Create the folder
Create a folder inside your Fiji installation directory:

```
Fiji.app/luts_custom/
```

### Step 2 — Put your `.lut` files inside
Example:

```
Fiji.app/luts_custom/MyLUT1.lut
Fiji.app/luts_custom/MyLUT2.lut
```

### Step 3 — Edit the plugin variable
Open `LUT_Picker.js` in a text editor and change:

```js
var lutFolderName = "luts";
```

to:

```js
var lutFolderName = "luts_custom";
```

### Step 4 — Restart Fiji
Restart Fiji so the script reloads, then run the plugin again.

---

## Notes

- The plugin is designed for grayscale images, and uses Fiji's LUT application functions.
- If your LUT folder does not exist, the plugin will show an error message and stop.

---

## Author

Guo Zonglin (Harbin Institute of Technology, China)  
E-mail: guo_zonglin@163.com
