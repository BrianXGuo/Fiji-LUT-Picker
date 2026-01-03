// LUT Picker for Fiji (JavaScript / Nashorn-compatible)
// author: Guo Zonglin (Harbin Institute of Technology, China), e-mail: guo_zonglin@163.com

importClass(Packages.javax.swing.JFrame);
importClass(Packages.javax.swing.JPanel);
importClass(Packages.javax.swing.JTextField);
importClass(Packages.javax.swing.JList);
importClass(Packages.javax.swing.JScrollPane);
importClass(Packages.javax.swing.DefaultListModel);
importClass(Packages.javax.swing.BorderFactory);
importClass(Packages.javax.swing.WindowConstants);
importClass(Packages.javax.swing.ScrollPaneConstants);
importClass(Packages.javax.swing.ImageIcon);
importClass(Packages.javax.swing.DefaultListCellRenderer);
importClass(Packages.javax.swing.ListCellRenderer);

importClass(Packages.java.awt.BorderLayout);
importClass(Packages.java.awt.Dimension);
importClass(Packages.java.awt.event.MouseAdapter);
importClass(Packages.java.awt.event.KeyAdapter);
importClass(Packages.java.awt.event.KeyEvent);

importClass(Packages.java.io.File);
importClass(Packages.java.io.FileInputStream);

importClass(Packages.java.util.HashMap);
importClass(Packages.java.util.ArrayList);

importClass(Packages.java.awt.image.BufferedImage);

importClass(Packages.ij.IJ);
importClass(Packages.ij.ImagePlus);
importClass(Packages.ij.WindowManager);
importClass(Packages.ij.plugin.LutLoader);

function main() {

  // ===== Configuration =====
  var lutFolderName = "luts";
  var recursiveScan = true;
  var previewWidth  = 90;
  var previewHeight = 12;
  var numColumns    = 4;     // 4 columns
  var cellHeight    = 22;
  // =========================

  // --- Pinned first-batch order ---
  var pinnedOrder = [
  	"Fire",
  	"Grays",
  	"Ice",
  	"Spectrum",
  	"Red",
  	"Green",
  	"Blue",
  	"Cyan",
  	"Magenta",
  	"Yellow",
    "16 colors",
    "5 ramps",
    "6 shades",
    "blue orange icb",
    "brgbcmyw",
    "cool",
    "Cyan Hot",
    "edges",
    "gem",
    "glasbey",
    "glasbey inverted",
    "glasbey on dark",
    "glow",
    "Green Fire Blue",
    "Hi",
    "HiLo",
    "ICA",
    "ICA2",
    "ICA3",
    "Magenta Hot",
    "mpl-inferno",
    "mpl-magma",
    "mpl-plasma",
    "mpl-viridis",
    "Orange Hot",
    "phase",
    "physics",
    "Rainbow RGB",
    "Red Hot",
    "royal",
    "sepia",
    "smart",
    "thal",
    "thallium",
    "Thermal",
    "unionjack",
    "Yellow Hot"
  ];

  function normalizeKey(name) {
    var s = "" + name;
    var lower = s.toLowerCase();
    if (lower.endsWith(".lut")) s = s.substring(0, s.length - 4);
    s = ("" + s).toLowerCase();
    s = s.replace(/[\s_\-\/\\]+/g, "");
    return s;
  }

  var pinnedRank = {};
  for (var pi = 0; pi < pinnedOrder.length; pi++) {
    pinnedRank[normalizeKey(pinnedOrder[pi])] = pi;
  }

  function listLuts(folder, recursive) {
    var dir = new File(folder);
    if (!dir.exists() || !dir.isDirectory()) return [];

    var out = [];
    var files = dir.listFiles();
    if (files == null) return out;

    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (f.isDirectory() && recursive) {
        var sub = listLuts(f.getAbsolutePath(), true);
        for (var j = 0; j < sub.length; j++) out.push(sub[j]);
      } else if (f.isFile() && f.getName().toLowerCase().endsWith(".lut")) {
        out.push(f);
      }
    }
    return out;
  }

  function stripLutSuffix(name) {
    var lower = ("" + name).toLowerCase();
    if (lower.endsWith(".lut")) return name.substring(0, name.length - 4);
    return name;
  }

  function sortFilesPinnedThenAlpha(files) {
    var pinned = new ArrayList();
    var others = new ArrayList();

    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var key = normalizeKey(f.getName());
      if (pinnedRank.hasOwnProperty(key)) pinned.add(f);
      else others.add(f);
    }

    pinned.sort(function(a, b) {
      var ra = pinnedRank[normalizeKey(a.getName())];
      var rb = pinnedRank[normalizeKey(b.getName())];
      if (ra < rb) return -1;
      if (ra > rb) return 1;
      return a.getName().toLowerCase().compareTo(b.getName().toLowerCase());
    });

    others.sort(function(a, b) {
      return a.getName().toLowerCase().compareTo(b.getName().toLowerCase());
    });

    var merged = [];
    for (var p = 0; p < pinned.size(); p++) merged.push(pinned.get(p));
    for (var o = 0; o < others.size(); o++) merged.push(others.get(o));
    return merged;
  }

  function getActiveImageSafely() {
    var imp = WindowManager.getCurrentImage();
    if (imp == null) {
      try { imp = IJ.getImage(); } catch (e) { imp = null; }
    }
    return imp;
  }

  function applyLutFileToActiveImage(file) {
    var imp = getActiveImageSafely();
    if (imp == null) {
      IJ.error("No image is open. Please open an image first.");
      return;
    }

    if (imp.getType() == ImagePlus.COLOR_RGB) {
      IJ.error("Current image is RGB. LUT only works on grayscale images. Try: Image → Type → 8-bit (or 16-bit)");
      return;
    }

    try {
      var win = imp.getWindow();
      if (win != null) win.toFront();
    } catch (e) {}

    var loader = new LutLoader();
    loader.run(file.getAbsolutePath());
    imp.updateAndDraw();
  }

  // --- LUT preview icon cache ---
  var iconCache = new HashMap();

  function readLutBytes(file) {
    var fis = null;
    try {
      fis = new FileInputStream(file);
      var buf = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 768);
      var total = 0;
      while (total < 768) {
        var n = fis.read(buf, total, 768 - total);
        if (n < 0) break;
        total += n;
      }
      if (total < 768) return null;
      return buf;
    } catch (e) {
      return null;
    } finally {
      try { if (fis != null) fis.close(); } catch (e2) {}
    }
  }

  function makePreviewIcon(file) {
    var key = file.getAbsolutePath();
    if (iconCache.containsKey(key)) return iconCache.get(key);

    var bytes = readLutBytes(file);
    if (bytes == null) {
      var img0 = new BufferedImage(previewWidth, previewHeight, BufferedImage.TYPE_INT_RGB);
      var icon0 = new ImageIcon(img0);
      iconCache.put(key, icon0);
      return icon0;
    }

    var img = new BufferedImage(previewWidth, previewHeight, BufferedImage.TYPE_INT_RGB);

    for (var x = 0; x < previewWidth; x++) {
      var idx = Math.floor((x * 255) / (previewWidth - 1));
      if (idx < 0) idx = 0;
      if (idx > 255) idx = 255;

      var r = bytes[idx] & 255;
      var g = bytes[256 + idx] & 255;
      var b = bytes[512 + idx] & 255;
      var rgb = (r << 16) | (g << 8) | b;

      for (var y = 0; y < previewHeight; y++) {
        img.setRGB(x, y, rgb);
      }
    }

    var icon = new ImageIcon(img);
    iconCache.put(key, icon);
    return icon;
  }

  // Detect Fiji directory and LUT folder
  var imagejDir = IJ.getDirectory("imagej");
  if (imagejDir == null) {
    IJ.error("Cannot detect Fiji/ImageJ directory.");
    return;
  }

  var lutDir = imagejDir + lutFolderName;
  var lutDirFile = new File(lutDir);

  if (!lutDirFile.exists() || !lutDirFile.isDirectory()) {
    IJ.error("Cannot find LUT folder:\n" + lutDir);
    return;
  }

  var originalLuts = sortFilesPinnedThenAlpha(listLuts(lutDir, recursiveScan));
  if (originalLuts.length == 0) {
    IJ.error("No .lut files found in:\n" + lutDir);
    return;
  }

  // ============ GUI ============
  var currentLuts = originalLuts;

  var model = new DefaultListModel();
  for (var i = 0; i < currentLuts.length; i++) {
    model.addElement(stripLutSuffix(currentLuts[i].getName()));
  }

  var list = new JList(model);
  list.setLayoutOrientation(Packages.javax.swing.JList.HORIZONTAL_WRAP);
  list.setVisibleRowCount(-1);
  list.setFixedCellHeight(cellHeight);

  // --- Renderer: JavaAdapter(ListCellRenderer, ...) ---
  var baseRenderer = new DefaultListCellRenderer();
  var renderer = new JavaAdapter(ListCellRenderer, {
    getListCellRendererComponent: function(jlist, value, index, isSelected, cellHasFocus) {
      var label = baseRenderer.getListCellRendererComponent(jlist, value, index, isSelected, cellHasFocus);

      if (index >= 0 && index < currentLuts.length) {
        label.setIcon(makePreviewIcon(currentLuts[index]));
      } else {
        label.setIcon(null);
      }

      label.setText("  " + value);
      label.setIconTextGap(8);
      label.setPreferredSize(new Dimension(1, cellHeight));
      return label;
    }
  });
  list.setCellRenderer(renderer);

  function applySelected() {
    var idx = list.getSelectedIndex();
    if (idx < 0 || idx >= currentLuts.length) return;
    applyLutFileToActiveImage(currentLuts[idx]);
  }

  var allowApply = true;

  function selectIndexSilently(index) {
    allowApply = false;
    if (index >= 0 && index < model.getSize()) {
      list.setSelectedIndex(index);
      list.ensureIndexIsVisible(index);
    }
    allowApply = true;
  }

  list.addMouseListener(new MouseAdapter() {
    mouseClicked: function(e) {
      if (e.getClickCount() >= 1) {
        if (allowApply) applySelected();
      }
    }
  });

  list.addKeyListener(new KeyAdapter() {
    keyReleased: function(e) {
      var code = e.getKeyCode();
      if (code == KeyEvent.VK_UP || code == KeyEvent.VK_DOWN ||
          code == KeyEvent.VK_LEFT || code == KeyEvent.VK_RIGHT ||
          code == KeyEvent.VK_PAGE_UP || code == KeyEvent.VK_PAGE_DOWN ||
          code == KeyEvent.VK_HOME || code == KeyEvent.VK_END) {
        if (allowApply) applySelected();
      }
    },
    keyPressed: function(e) {
      if (e.getKeyCode() == KeyEvent.VK_ENTER) {
        if (allowApply) applySelected();
        e.consume();
      }
    }
  });

  var search = new JTextField();
  search.setToolTipText("Search LUT name... (Enter applies selected)");
  search.addActionListener(function(e) { applySelected(); });

  function rebuildModelFiltered(queryLower) {
    model.clear();
    currentLuts = [];

    for (var i = 0; i < originalLuts.length; i++) {
      var file = originalLuts[i];
      var display = stripLutSuffix(file.getName());
      if (display.toLowerCase().indexOf(queryLower) >= 0) {
        model.addElement(display);
        currentLuts.push(file);
      }
    }

    if (currentLuts.length > 0) {
      selectIndexSilently(0);
    }
    list.revalidate();
    list.repaint();
  }

  search.addKeyListener(new KeyAdapter() {
    keyReleased: function(e) {
      var q = ("" + search.getText()).toLowerCase();
      rebuildModelFiltered(q);
    }
  });

  var scroll = new JScrollPane(list);
  scroll.setVerticalScrollBarPolicy(ScrollPaneConstants.VERTICAL_SCROLLBAR_AS_NEEDED);
  scroll.setHorizontalScrollBarPolicy(ScrollPaneConstants.HORIZONTAL_SCROLLBAR_NEVER);

  var frame = new JFrame("LUT Picker (from " + lutFolderName + ")");
  frame.setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);

  var panel = new JPanel(new BorderLayout(8, 8));
  panel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
  panel.add(search, BorderLayout.NORTH);
  panel.add(scroll, BorderLayout.CENTER);

  frame.getContentPane().add(panel);

  frame.setPreferredSize(new Dimension(1120, 620));
  frame.pack();
  frame.setLocationRelativeTo(null);
  frame.setVisible(true);

  var viewportWidth = scroll.getViewport().getWidth();
  var gap = 6;
  var cellWidth = Math.floor((viewportWidth - (numColumns - 1) * gap) / numColumns);
  if (cellWidth < 210) cellWidth = 210;

  list.setFixedCellWidth(cellWidth);
  list.revalidate();
  list.repaint();

  if (model.getSize() > 0) {
    selectIndexSilently(0);
  }

  search.requestFocusInWindow();

//  IJ.log("LUT Picker: using LUT directory = " + lutDir);
}

main();
