# Check box option
In the TPL:

```
<div class="options-section">
    <h4>Background effects</h4>

    <p>On the desktop application, it's possible to use a semi-transparent background tinted in the colors of the user's wallpaper to add a touch of color.</p>

    <div class="col-6 side-checkbox">
        <label class="form-check">
            <input type="checkbox" class="background-effects form-check-input" />
            Enable background effects (Windows 11 only)
        </label>
    </div>
</div>
```

In `doRender()`:

```
doRender() {
	this.$backgroundEffects = this.$widget.find("input.background-effects");

	this.$backgroundEffects.on("change", () => this.updateCheckboxOption("backgroundEffects", this.$backgroundEffects));
}
```

In `optionsLoaded(options)`:

```
async optionsLoaded(options) {

    this.setCheckboxState(this.$backgroundEffects, options.backgroundEffects);

}
```