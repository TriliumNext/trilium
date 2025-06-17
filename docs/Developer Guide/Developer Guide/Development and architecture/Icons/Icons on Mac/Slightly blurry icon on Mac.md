# Slightly blurry icon on Mac
Slightly blurry in extended preview on Mac

<figure class="image"><img src="1_Slightly blurry icon on Ma.png"></figure>

In the screenshot, the icon is around 650px whereas the closest image we have is 512px, so that might explain the blur. Adding an `ic10` (`1024x1024`, aka `512x512@2x` to see what happens).

Before:

```
File: ../images/app-icons/mac/icon.icns
  ic09: 62069 bytes, png: 512x512
```

After:

```
File: ../images/app-icons/mac/icon.icns
  icp4: 1140 bytes, png: 16x16
  icp5: 1868 bytes, png: 32x32
  ic07: 9520 bytes, png: 128x128
  ic09: 62069 bytes, png: 512x512
  ic10: 180442 bytes, png: 512x512@2x
```

Even with a 1024x1024 icon, the image is still blurry.

Comparing the `.icns` file from the Electron build reveals that the `.icns` file has been tampered with:

<figure class="table"><table><thead><tr><th>The <code>electron.icns</code> from the resulting build</th><th>The icon source</th></tr></thead><tbody><tr><td><pre><code class="language-text-plain">File: images/app-icons/mac/electron.icns
  icp4: 1140 bytes, png: 16x16
  icp5: 1868 bytes, png: 32x32
  ic07: 9520 bytes, png: 128x128
  ic09: 62069 bytes, png: 512x512
  ic10: 180442 bytes, png: 512x512@2x</code></pre></td><td><pre><code class="language-text-plain">File: images/app-icons/mac/icon.icns
  icp4: 1648 bytes, png: 16x16
  icp5: 4364 bytes, png: 32x32
  ic07: 26273 bytes, png: 128x128
  ic09: 206192 bytes, png: 512x512
  ic10: 716034 bytes, png: 512x512@2x</code></pre></td></tr></tbody></table></figure>

The bluriness might come from the image itself: [https://stackoverflow.com/questions/54030521/convert-svg-to-png-with-sharp-edges](https://stackoverflow.com/questions/54030521/convert-svg-to-png-with-sharp-edges) 

Rendering with Inkscape (left) vs ImageMagick (right):

<figure class="image"><img src="2_Slightly blurry icon on Ma.png"></figure>

Now in macOS it's also rendering quite nicely:

<figure class="image"><img src="Slightly blurry icon on Ma.png"></figure>