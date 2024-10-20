# Rambling
I want a music generator that will play one or more voices using various random note generators. The generators may be random walk, or stocastic up to 3 degrees. Each voide can be assigned to a sound font file bank and preset. 
Voice controls include
* start and stop times (may be multiple)
* soundfont bank and preset
* generation algorithm for note midi number (sine, triangular, square, randon walk, stocastic, e.g)
* generation algorithm for note modulation around the midi number
* generation algorithm for note start time
* generation algorithm for note duration 
* envelop controls (velociy, attack, decay, sustain, hold, release, volume) these may be changed over time
Files
* piece generation parameters (like JSON)
* generated sequence (XML)
* sound export (mpeg, etc.)
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
# XML File Structure
```xml
<?xml verson="1.0"?>
  <fileContents
    name = 'string'
    timeLineStyle = 'int'
    tempo = 'int'
    <timeSignature
      beatsPerMinute = 'int'
      measureUnit = 'int'
    /> 
    snap = 'boolean'
    measureSnapUnit = 'int'
    secondSnapUnit = 'int'
    SFFileName = 'string'
  >
    <tracks>
      <track 
        name = 'string'
        order =  'int'
        mute = 'boolean'
        solo = 'boolean'
        volume = 'float'
        pan = 'float'
      >
        <generators>
          <generator
            name = 'string'
            startTime = 'float'
            stopTime = 'float'
            type = 'string'
            presetNumber = 'int'
            midi = 'int'
            FMType = 'int'
            FMAmplitude = 'float'
            FMFrequency = 'float'
            FMPhase = 'float'
            VMCenter = 'int'
            VMType = 'int'
            VMAmplitude = 'float'
            VMFrequency = 'float'
            VMPhase = 'float'
            PMCenter = 'int'
            PMType = 'int'
            PMAmplitude = 'float'
            PMFrequency = 'float'
            PMPhase = 'float'
          />
        <generators/>
      <track/>
    <tracks/>
  <fileContents/>
```
#Thanx
Special thanx to various people
