# Options
## Read an option

Add the import to the service (make sure the relative path is correct):

```javascript
import options from "../../services/options.js";
```

Them simply read the option:

```javascript
this.firstDayOfWeek = options.getInt("firstDayOfWeek");
```