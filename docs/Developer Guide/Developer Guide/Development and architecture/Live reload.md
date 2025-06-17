# Live reload
## Server live reload

If running the server using `npm run start-server`, the server will watch for changes in `src/public` and trigger a frontend reload if that occurs.

## Electron live reload

Similarly, `npm run start-electron` supports live refresh  as well.

However, a core difference is that Electron watches `dist/src/public` instead of `src/public` since Electron runs on its own copy of the files.

To ameliorate that, a separate watch script has been implemented which automatically copies files from `src/public` to `dist/src/public` whenever a change is detected. To run it:

```
npm run 
```

## Technical details

*   This mechanism is managed at server level by watching for changes in`services/ws.ts`.