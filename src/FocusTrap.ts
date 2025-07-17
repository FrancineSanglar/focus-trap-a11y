const getFocusableElements = (container: Element): HTMLElement[] => {
  const selector = [
    'a[href]',
    'button',
    'textarea',
    'input',
    'select',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ')
  return [...container.querySelectorAll<HTMLElement>(selector)]
    .filter(element =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true'
    )
}

const getActiveElementIndex = (elements: HTMLElement[]): number => {
  const active = document.activeElement as HTMLElement
  if (!active) return -1
  return elements.indexOf(active)
}

const getNavigableElements = (container: Element): HTMLElement[] => {
  return [...container.querySelectorAll<HTMLElement>("*")]
    .filter(element => {

      if (!(element instanceof HTMLElement)) return false
      const style = window.getComputedStyle(element)

      return (
        !element.hasAttribute('disabled') &&
        element.getAttribute('aria-hidden') !== 'true' &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      )
    }
    )
}

export class FocusTrap extends HTMLElement {
  private focusableElements: HTMLElement[] = []
  private _isVisible = false;
  private _hiddenSiblings: HTMLElement[] = [];
  private observer!: MutationObserver;

  connectedCallback() {
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '-1')
    }
    this.addEventListener('keydown', this.onKeyDown)
    requestAnimationFrame(() => this.setInitialFocus())

    this.observer = new MutationObserver(() => {
      if (!getNavigableElements(this) && this._isVisible) {
        this._isVisible = false
        this.restoreSiblings()
      }
    })

    this.observer.observe(this, {
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden'],
      subtree: false
    })
  }

  disconnectedCallback() {
    this.removeEventListener('keydown', this.onKeyDown)
    this.observer?.disconnect()
  }


  private setInitialFocus() {
    this.focusableElements = getFocusableElements(this)
    const active = document.activeElement
    if (!this.contains(active)) {
      this.focusableElements[0]?.focus()
    }
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const active = document.activeElement as HTMLElement
    if (!this.contains(active)) return

    const isTab = event.key === 'Tab'
    const isArrow = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)

    if (isTab) return this.handleTab(event)
    else if (isArrow) return this.handleArrow(event)
  }

  private handleTab(event: KeyboardEvent) {
    const focusableElementsList = getFocusableElements(this)
    if (focusableElementsList.length === 0) return

    const activeElementIndex = getActiveElementIndex(focusableElementsList)
    const isActiveFirst = activeElementIndex === 0
    const isActiveLast = activeElementIndex === focusableElementsList.length - 1

    if (isActiveFirst && event.shiftKey) {
      focusableElementsList.at(-1)?.focus()
      event.preventDefault()
    } else if (isActiveLast && !event.shiftKey) {
      focusableElementsList[0]?.focus()
      event.preventDefault()
    }
  }

  private handleArrow(event: KeyboardEvent) {
    const navigableElementsList = getNavigableElements(this)
    if (navigableElementsList.length === 0) {
      this._isVisible = false
      this.restoreSiblings()
      return
    } else {
      this._isVisible = true
      this.hideSiblings()
    }

    const activeElementIndex = getActiveElementIndex(navigableElementsList)
    const isActiveFirst = activeElementIndex === 0
    const isActiveLast = activeElementIndex === navigableElementsList.length - 1

    if (isActiveFirst && (event.key === 'ArrowUp' || event.key === 'ArrowLeft')) {
      navigableElementsList.at(-1)?.focus()
      event.preventDefault()
      return
    } else if (isActiveLast && (event.key === 'ArrowDown' || event.key === 'ArrowRight')) {
      navigableElementsList[0]?.focus()
      event.preventDefault()
      return
    }
  }

  private hideSiblings = () => {
    const parent = this.parentElement || document.body
    const siblings = Array.from(parent.children).filter(
      (el): el is HTMLElement => el !== this && el instanceof HTMLElement
    )
    siblings.forEach(el => {
      if (!el.hasAttribute('aria-hidden')) {
        el.setAttribute('aria-hidden', 'true')
        this._hiddenSiblings.push(el)
      }
    })
  }

  private restoreSiblings = () => {
    this._hiddenSiblings.forEach(el => {
      el.removeAttribute('aria-hidden')
    })
    this._hiddenSiblings = []
  }
}

customElements.define('focus-trap', FocusTrap)


