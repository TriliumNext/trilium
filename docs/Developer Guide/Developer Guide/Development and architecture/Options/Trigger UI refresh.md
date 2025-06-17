# Trigger UI refresh
Call `utils.reloadFrontendApp`, but make sure to wait for the option to be saved first.

```
this.$backgroundEffects.on("change", async () => {

    await this.updateCheckboxOption("backgroundEffects", this.$backgroundEffects);

    utils.reloadFrontendApp("background effect change");

});
```