# Refresh widget with option change
To make a widget react to a change of a given option, simply add the following to the widget:

```javascript
async entitiesReloadedEvent({loadResults}) {
    if (loadResults.getOptionNames().includes("firstDayOfWeek")) {
        // Do something.
    }        
}
```