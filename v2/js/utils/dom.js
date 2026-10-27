// ======================================
// UTILIDADES DOM · SIN innerHTML DINÁMICO
// ======================================

export function h(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);

  Object.entries(attrs || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === false) return;

    if (key === "class" || key === "className") {
      element.className = value;
      return;
    }

    if (key === "text") {
      element.textContent = value;
      return;
    }

    if (key === "dataset") {
      Object.assign(element.dataset, value);
      return;
    }

    if (key === "style" && typeof value === "object") {
      Object.entries(value).forEach(([property, propertyValue]) => {
        if (property.startsWith("--")) {
          element.style.setProperty(property, propertyValue);
        } else {
          element.style[property] = propertyValue;
        }
      });
      return;
    }

    if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(key.slice(2).toLowerCase(), value);
      return;
    }

    if (key in element) {
      try {
        element[key] = value;
        return;
      } catch {
        // Algunas propiedades son de solo lectura; se intenta como atributo.
      }
    }

    element.setAttribute(key, String(value));
  });

  appendChildren(element, children);
  return element;
}

function appendChildren(element, children) {
  children.flat(Infinity).forEach(child => {
    if (child === null || child === undefined || child === false) return;
    if (child instanceof Node) {
      element.appendChild(child);
      return;
    }
    element.appendChild(document.createTextNode(String(child)));
  });
}

export function clear(element) {
  if (element) element.replaceChildren();
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function debounce(fn, wait = 250) {
  let timer = null;

  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

export function showToast(message, type = "info", duration = 4500) {
  let root = document.getElementById("toast-root");

  if (!root) {
    root = h("div", {
      id: "toast-root",
      class: "toast-root",
      "aria-live": "polite",
      "aria-atomic": "false"
    });
    document.body.appendChild(root);
  }

  const toast = h("div", {
    class: `toast toast--${type}`,
    role: "status"
  }, message);

  root.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

export function confirmDialog({
  title = "Confirmar",
  message = "",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false
} = {}) {
  if (typeof HTMLDialogElement === "undefined") {
    return Promise.resolve(window.confirm(message || title));
  }

  return new Promise(resolve => {
    const dialog = h("dialog", { class: "dialog" },
      h("form", { method: "dialog", class: "dialog__panel" },
        h("h2", { class: "dialog__title" }, title),
        message ? h("p", { class: "dialog__message" }, message) : null,
        h("div", { class: "dialog__actions" },
          h("button", {
            type: "button",
            class: "btn btn--ghost",
            onClick: () => dialog.close("cancel")
          }, cancelLabel),
          h("button", {
            type: "submit",
            value: "confirm",
            class: `btn ${danger ? "btn--danger" : "btn--primary"}`
          }, confirmLabel)
        )
      )
    );

    dialog.addEventListener("close", () => {
      const confirmed = dialog.returnValue === "confirm";
      dialog.remove();
      resolve(confirmed);
    });

    dialog.addEventListener("cancel", event => {
      event.preventDefault();
      dialog.close("cancel");
    });

    document.body.appendChild(dialog);
    dialog.showModal();
  });
}

export function promptDialog({
  title = "Ingresar dato",
  message = "",
  label = "",
  type = "text",
  placeholder = "",
  confirmLabel = "Guardar",
  cancelLabel = "Cancelar",
  required = true,
  value = ""
} = {}) {
  if (typeof HTMLDialogElement === "undefined") {
    const answer = window.prompt(message || title, value);
    return Promise.resolve(answer === null ? null : answer.trim());
  }

  return new Promise(resolve => {
    const input = h("input", {
      class: "input",
      type,
      placeholder,
      value,
      autocomplete: "off"
    });

    const error = h("p", {
      class: "field__error",
      role: "alert",
      hidden: true
    });

    const form = h("form", { method: "dialog", class: "dialog__panel" },
      h("h2", { class: "dialog__title" }, title),
      message ? h("p", { class: "dialog__message" }, message) : null,
      label ? h("label", { class: "field" },
        h("span", { class: "field__label" }, label),
        input,
        error
      ) : input,
      h("div", { class: "dialog__actions" },
        h("button", {
          type: "button",
          class: "btn btn--ghost",
          onClick: () => dialog.close("cancel")
        }, cancelLabel),
        h("button", {
          type: "submit",
          value: "confirm",
          class: "btn btn--primary"
        }, confirmLabel)
      )
    );

    form.addEventListener("submit", event => {
      if (required && !input.value.trim()) {
        event.preventDefault();
        error.hidden = false;
        error.textContent = "Este campo es obligatorio.";
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }

      error.hidden = true;
      input.removeAttribute("aria-invalid");
    });

    const dialog = h("dialog", { class: "dialog" }, form);

    dialog.addEventListener("close", () => {
      const confirmed = dialog.returnValue === "confirm";
      const answer = confirmed ? input.value.trim() : null;
      dialog.remove();
      resolve(answer);
    });

    dialog.addEventListener("cancel", event => {
      event.preventDefault();
      dialog.close("cancel");
    });

    document.body.appendChild(dialog);
    dialog.showModal();
    setTimeout(() => input.focus(), 0);
  });
}

export function setButtonBusy(button, busy, busyLabel = "Guardando…") {
  if (!button) return;

  if (busy) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }
    button.disabled = true;
    button.textContent = busyLabel;
    button.setAttribute("aria-busy", "true");
    return;
  }

  button.disabled = false;
  button.textContent = button.dataset.originalText || button.textContent;
  button.removeAttribute("aria-busy");
  delete button.dataset.originalText;
}

export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Se intenta el método antiguo.
  }

  try {
    const area = h("textarea", {
      value: text,
      style: { position: "fixed", top: "-1000px", opacity: "0" }
    });
    document.body.appendChild(area);
    area.focus();
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  } catch {
    return false;
  }
}

export function downloadTextFile(
  filename,
  content,
  mime = "text/csv;charset=utf-8",
  addBom = true
) {
  const parts = addBom ? ["\uFEFF", content] : [content];
  const blob = new Blob(parts, { type: mime });
  const url = URL.createObjectURL(blob);
  const link = h("a", { href: url, download: filename });
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function focusFirst(container) {
  const target = container?.querySelector(
    "input:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex='0']"
  );
  if (target) target.focus();
}
