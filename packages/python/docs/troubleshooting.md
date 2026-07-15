# Troubleshooting

## Editor does not appear

- confirm `olloweditor.browser.js` loads before `olloweditor-init.js`
- confirm the textarea has `data-olloweditor="true"`
- inspect browser console errors

## CSS not loading

- Django: render `form.media`
- Flask: check the blueprint route
- FastAPI: check the mount path used by `olloweditor_assets(path=...)`

## Browser global missing

- serve `olloweditor.browser.js`
- do not substitute the ES module build in a plain script tag

## Django `collectstatic` issue

- verify `olloweditor.apps.OllowEditorConfig` is installed
- rerun `python manage.py collectstatic`

## Flask blueprint conflict

- avoid conflicting `olloweditor` blueprint registration
- use `OLLOWEDITOR_URL_PREFIX` for a different served path

## FastAPI mount conflict

- choose a different `path` or `name` when another route already uses the same mount

## Multiple initialization

- use `window.bootOllowEditor(root)` only for new dynamic content

## Invalid `data-olloweditor-options` JSON

- the initializer logs an error and continues booting other editors

## Missing framework extra

- install the needed extra instead of the base package alone
