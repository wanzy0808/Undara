import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FloatingField } from "../components/ui/floating-field.tsx";
import { Input } from "../components/ui/input.tsx";

test("floating labels associate with the original control and preserve validation, autocomplete and data", () => {
  const html = renderToStaticMarkup(React.createElement(FloatingField, { label: "nama tamu" },
    React.createElement(Input, { id: "guest-name", name: "guestName", value: "hendra & reni", onChange() {}, autoComplete: "name", required: true, maxLength: 120, "aria-invalid": true, "aria-describedby": "guest-error" })));
  assert.match(html, /for="guest-name"/);
  assert.match(html, /id="guest-name"/);
  assert.match(html, /name="guestName"/);
  assert.match(html, /value="hendra &amp; reni"/);
  assert.match(html, /autoComplete="name"/i);
  assert.match(html, /required=""/);
  assert.match(html, /maxLength="120"/i);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-describedby="guest-error"/);
  assert.match(html, />Nama Tamu<\/span>/);
});

test("a label wrapper keeps handlers, refs and native typing separate from display capitalization", () => {
  let received;
  function Probe(props) { received = props; return React.createElement("input", props); }
  const ref = React.createRef();
  const calls = [];
  const onChange = (event) => calls.push(event.target.value);
  renderToStaticMarkup(React.createElement(FloatingField, { label: "nama", style: { width: 192 } },
    React.createElement(Probe, { ref, onChange, value: "", disabled: true, className: "capitalize", placeholder: "Andi", "aria-label": "Nama penerima" })));
  assert.equal(received.ref, ref);
  assert.equal(received.onChange, onChange);
  assert.equal(received.disabled, true);
  assert.equal(received["aria-label"], "Nama penerima");
  assert.equal(received.placeholder, "Andi");
  received.onChange({ target: { value: "hendra" } });
  assert.deepEqual(calls, ["hendra"]);
});

test("text fields follow their native value so cleared defaults and autofill can move the label", () => {
  for (const props of [{ value: "", onChange() {} }, { value: 0, onChange() {} }, { defaultValue: "Saved name" }, { defaultValue: "", readOnly: true }]) {
    const html = renderToStaticMarkup(React.createElement(FloatingField, { label: "Nama" }, React.createElement("input", props)));
    assert.match(html, /placeholder=" "/);
    assert.doesNotMatch(html, /data-filled=/);
    assert.match(html, /for="([^"]+)"/);
    const id = html.match(/for="([^"]+)"/)[1];
    assert.ok(html.includes(`id="${id}"`));
  }
});

test("selects preserve all native options and distinguish an empty choice from zero", () => {
  for (const value of ["", "0", "VIP"]) {
    const html = renderToStaticMarkup(React.createElement(FloatingField, { label: "kategori tamu" },
      React.createElement("select", { name: "category", value, onChange() {}, disabled: true },
        React.createElement("option", { value: "" }, "Pilih kategori"),
        React.createElement("option", { value: "0" }, "Reguler"),
        React.createElement("option", { value: "VIP" }, "VIP"))));
    assert.match(html, /name="category"/);
    assert.match(html, /disabled=""/);
    assert.match(html, /<option value="VIP"/);
    assert.match(html, />Kategori Tamu<\/span>/);
    assert.ok(html.includes(value === "" ? 'data-empty-select="true"' : 'data-filled="true"'));
  }
});
