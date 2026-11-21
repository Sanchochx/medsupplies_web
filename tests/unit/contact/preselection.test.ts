import { Window } from 'happy-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { preselectRequestType, requestTypeFromClick } from '../../../src/lib/contact/preselection';

let window: Window;
let document: Document;

beforeEach(() => {
  window = new Window();
  document = window.document as unknown as Document;
  document.body.innerHTML = `
    <a id="product" href="/#contact" data-request-type="pharmaceuticals"><span id="inner">Browse</span></a>
    <a id="plain" href="/#contact">Request a quote</a>
    <a id="bogus" href="/#contact" data-request-type="not-a-type">Bogus</a>
    <select id="type">
      <option value="" disabled selected>Select a category</option>
      <option value="medical-devices">Medical Devices</option>
      <option value="pharmaceuticals">Pharmaceuticals</option>
    </select>`;
});

afterEach(() => {
  void window.happyDOM.close();
});

const byId = <T extends Element>(id: string): T => document.getElementById(id) as unknown as T;

describe('requestTypeFromClick', () => {
  it('reads the request type of the clicked link, also from a child element', () => {
    expect(requestTypeFromClick(byId('product'))).toBe('pharmaceuticals');
    expect(requestTypeFromClick(byId('inner'))).toBe('pharmaceuticals');
  });

  it('ignores links without the attribute, unknown types and non-elements', () => {
    expect(requestTypeFromClick(byId('plain'))).toBeNull();
    expect(requestTypeFromClick(byId('bogus'))).toBeNull();
    expect(requestTypeFromClick(null)).toBeNull();
  });
});

describe('preselectRequestType', () => {
  it('selects the matching option and reports the change', () => {
    const select = byId<HTMLSelectElement>('type');

    expect(preselectRequestType(select, 'pharmaceuticals')).toBe(true);
    expect(select.value).toBe('pharmaceuticals');
    expect(preselectRequestType(select, 'pharmaceuticals')).toBe(false);
  });

  it('leaves the select unchanged when it has no such option', () => {
    const select = byId<HTMLSelectElement>('type');

    expect(preselectRequestType(select, 'surgical-supplies')).toBe(false);
    expect(select.value).toBe('');
  });
});
