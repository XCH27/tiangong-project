import type { WorkbenchObjectRef } from '@craft-agent/shared/protocol'

const STYLE_KEYS = ['color', 'width', 'height', 'borderRadius', 'opacity', 'transform', 'left', 'top'] as const

export interface DomElementSnapshot {
  selector: string
  computedStyle: Record<string, string>
  textContent: string
}

export function buildDomSnapshotScript(selector: string): string {
  return `(() => {
    const selector = ${JSON.stringify(selector)};
    const element = document.querySelector(selector);
    if (!element) throw new Error('Missing DOM target: ' + selector);
    const style = getComputedStyle(element);
    const computedStyle = {};
    for (const key of ${JSON.stringify([...STYLE_KEYS])}) {
      computedStyle[key] = style[key];
    }
    return {
      selector,
      computedStyle,
      textContent: element.textContent ?? '',
    };
  })()`
}

export function applyDomSnapshotToObject(object: WorkbenchObjectRef, snapshot: DomElementSnapshot): WorkbenchObjectRef {
  return {
    ...object,
    locator: {
      ...object.locator,
      selector: snapshot.selector,
      computedStyle: snapshot.computedStyle,
      textContent: snapshot.textContent,
    },
    preview: {
      ...object.preview,
      text: snapshot.textContent || object.preview?.text,
    },
  }
}
