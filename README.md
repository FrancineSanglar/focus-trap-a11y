# `<focus-trap>` – Accessible Web Component

`<focus-trap>` is a Web Component designed with **accessibility** in mind. It traps keyboard focus within a modal or container, ensuring a safe navigation experience for both **keyboard users (Tab, Shift+Tab)** and **screen reader users (Arrow keys)**.

Perfect for modals, dialogs, or any interactive area requiring strict focus control.

---

## 🧠 Features

- 🔒 Traps **tab navigation** (`Tab`, `Shift+Tab`) inside the component
- 🗺️ Traps **screen reader navigation** using **arrow keys** (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`)

## Using

```html
<script type="module" src="/node_modules/focus-trap-a11y/dist/index.js"></script>
<focus-trap>
  <div id="modal-container" class="modal-container">
    <h2>Example Modal</h2>
    <p>Modal is Open</p>
    <input type="text" placeholder="Your name" />
    <button>Save</button>
    <button id="close-modal" onclick="closeModal()">Close</button>
  </div>
</focus-trap>
```

## Installation

```sh
npm i focus-trap-a11y
```

## Import

```js

import 'tab-trap/dist/index.js';


```

