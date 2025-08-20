const isClient =
  typeof window !== 'undefined' &&
  typeof document !== 'undefined'

const getFocusableElements = (container: Element): HTMLElement[] => {
  if (!isClient) return []
  const selector = [
    'a[href]',
    'button',
    'textarea',
    'input',
    'select',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ')
  return [...container.querySelectorAll<HTMLElement>(selector)].filter(
    element =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true'
  )
}

const getActiveElementIndex = (elements: HTMLElement[]): number => {
  if (!isClient) return -1
  const active = document.activeElement as HTMLElement
  if (!active) return -1
  return elements.indexOf(active)
}

const getNavigableElements = (container: Element): HTMLElement[] => {
  if (!isClient) return []
  return [...container.querySelectorAll<HTMLElement>('*')].filter(element => {
    if (!(element instanceof HTMLElement)) return false
    const style = window.getComputedStyle(element)
    return (
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    )
  })
}

let FocusTrapBase: typeof HTMLElement
if (isClient) {
  FocusTrapBase = HTMLElement
} else {
  FocusTrapBase = class { } as any
}

let originalBodyOverflow: string | null = null

const lockBodyScroll = () => {
  if (!isClient) return
  originalBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

const unlockBodyScroll = () => {
  if (!isClient) return
  document.body.style.overflow = originalBodyOverflow || ''
  originalBodyOverflow = null
}

export class FocusTrap extends FocusTrapBase {
  private focusableElements: HTMLElement[] = []
  private _isVisible = false
  private _hiddenSiblings: HTMLElement[] = []
  private observer?: MutationObserver

  connectedCallback() {
    if (!isClient) return

    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '-1')
    }

    this.addEventListener('keydown', this.onKeyDown)
    this.addEventListener('focusin', this.onFocusIn)

    this.observer = new MutationObserver(() => {
      const style = window.getComputedStyle(this)
      const isActuallyVisible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'

      if (isActuallyVisible && !this._isVisible) {
        this.setInitialFocus()
      } else if (!getNavigableElements(this).length && this._isVisible) {
        this._isVisible = false
        this.restoreSiblings()
        unlockBodyScroll()
      }
    })

    this.observer.observe(this, {
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden'],
      subtree: true
    })

    requestAnimationFrame(() => {
      this.setInitialFocus()
    })
  }

  disconnectedCallback() {
    if (!isClient) return
    unlockBodyScroll()
    this.removeEventListener('keydown', this.onKeyDown)
    this.removeEventListener('focusin', this.onFocusIn)
    this.observer?.disconnect()
  }

  private setInitialFocus() {
    if (!isClient) return

    const navigableElements = getNavigableElements(this)
    this.focusableElements = getFocusableElements(this)

    if (navigableElements.length > 0) {
      lockBodyScroll()
      this._isVisible = true
      this.hideSiblings()
    }

    const active = document.activeElement
    if (!this.contains(active) && this.focusableElements.length > 0) {
      this.focusableElements[0]?.focus()
    }
  }

  private onFocusIn = (event: FocusEvent) => {
    if (!isClient) return

    // Se o novo elemento focado não está dentro do trap
    if (!this.contains(event.target as Node)) {
      const first = getFocusableElements(this)[0]
      if (first) {
        first.focus()
        event.preventDefault()
      }
    }
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (!isClient) return
    const active = event.target as HTMLElement
    if (!this.contains(active)) return


    const isTab = event.key === 'Tab'
    const isArrow = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)

    if (isTab) this.handleTab(event)
    else if (isArrow) this.handleArrow(event)
  }

  private handleTab(event: KeyboardEvent) {
    if (!isClient) return

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
    if (!isClient) return

    const tag = (event.target as HTMLElement).tagName.toLowerCase()
    const isTextInput =
      ['input', 'textarea', 'select'].includes(tag) ||
      (event.target as HTMLElement).isContentEditable ||
      (event.target as HTMLElement).getAttribute('role') === 'textbox'

    if (isTextInput) return

    const navigableElementsList = getNavigableElements(this)
    if (navigableElementsList.length === 0) {
      this._isVisible = false
      this.restoreSiblings()
      unlockBodyScroll()
      return
    }

    this._isVisible = true
    this.hideSiblings()

    const activeElementIndex = getActiveElementIndex(navigableElementsList)
    if (activeElementIndex === -1) return

    let nextIndex = activeElementIndex

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = (activeElementIndex + 1) % navigableElementsList.length
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = (activeElementIndex - 1 + navigableElementsList.length) % navigableElementsList.length
        break
    }

    navigableElementsList[nextIndex]?.focus()
    event.preventDefault()
  }

  private hideSiblings = () => {
    if (!isClient) return
    const parent = this.closest('[data-focus-scope]') || this.parentElement || document.body
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
    if (!isClient) return
    this._hiddenSiblings.forEach(el => {
      el.removeAttribute('aria-hidden')
    })
    this._hiddenSiblings = []
  }
}

if (isClient) {
  customElements.define('focus-trap', FocusTrap)
}
