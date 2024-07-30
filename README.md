# prettier-plugin-jinja-json-template

Formatter plugin for jinja2 json template files.

Jinja2 + json would be another one an approach

How to use with prettier standalone:
```typescript

import { format } from 'prettier/standalone';
import { plugin, PLUGIN_KEY } from 'prettier-plugin-jinja-json-template';

export const formatJinjaJson = async (code: string) => {
  return await format(code, {
    parser: PLUGIN_KEY,
    plugins: [plugin],
  });
};

```

## Install

```bash
npm install --save-dev prettier prettier-plugin-jinja-json-template
```
```bash
yarn add -D prettier prettier-plugin-jinja-json-template
```

Add the plugin to your `.prettierrc`:
```json
{
  "plugins": ["prettier-plugin-jinja-json-template"]
}
```

## Use

To format basic .json files, you'll have to override the used parser inside your `.prettierrc`:
```json
{
  "overrides": [
    {
      "files": ["*.json"],
      "options": {
        "parser": "jinja-json-template"
      }
    }
  ]
}
```

Run it on all json jinja files in your project:
```bash
npx prettier "**/*.json.jinja" --write
```

If you don't have a prettier config you can run the plugin with this command:
```bash
npx prettier "**/*.json.jinja" --plugin=prettier-plugin-jinja-json-template --parser=jinja-json-template --write 
```

