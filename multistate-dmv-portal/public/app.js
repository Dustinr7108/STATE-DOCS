const app = document.querySelector("#app");
const form = {
  code: "CA",
  recordType: "birth",
  county: "Los Angeles",
  obstacles: ["name_change", "marriage"],
  nameChangeReason: "marriage",
  legalName: "",
  nameAtEvent: "",
  priorNames: "",
  eventDate: "",
  eventYear: "",
  eventCity: "",
  parentNames: "",
  spouseName: "",
  dob: "",
  relationship: "self",
  purpose: "Personal identification",
  address1: "",
  address2: "",
  city: "",
  region: "",
  zip: "",
  phone: "",
  email: "",
  copies: 1,
  forSelf: true,
  authorized: false,
};

let directory = [];
let detail = null;

const REASONS = [
  ["marriage", "Marriage"],
  ["divorce", "Divorce"],
  ["adoption", "Adoption"],
  ["court_order", "Court order"],
  ["no_online", "No online service"],
  ["rejected", "Website rejected me"],
  ["older_record", "Older or local record"],
];

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
    else if (value !== false && value != null) node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

function text(tag, value, attrs) {
  const node = el(tag, attrs);
  node.textContent = value;
  return node;
}

function field(label, name, options = {}) {
  const input = el("input", {
    id: name,
    name,
    value: form[name] || "",
    autocomplete: options.autocomplete || "on",
    placeholder: options.placeholder || "",
    oninput: (event) => {
      form[name] = event.target.value;
    },
  });
  return el("label", {}, [text("span", label), input]);
}

async function load() {
  const [listRes, caRes] = await Promise.all([
    fetch("/api/records/jurisdictions"),
    fetch("/api/records/jurisdictions/CA"),
  ]);
  const list = await listRes.json();
  directory = list.jurisdictions;
  detail = await caRes.json();
  render();
}

function payload() {
  return {
    ...form,
    priorNames: form.priorNames.split(/[\n,]/).map((name) => name.trim()).filter(Boolean),
    obstacles: form.obstacles,
    copies: Number(form.copies) || 1,
  };
}

async function buildPacket(event) {
  event.preventDefault();
  const button = event.submitter || event.target.querySelector("button.primary");
  const result = document.querySelector("#result");
  result.replaceChildren(text("p", "Building your mail packet…"));
  if (button) button.disabled = true;
  try {
    const response = await fetch("/api/records/packet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not build the packet.");
    showResult(data);
  } catch (error) {
    result.replaceChildren(text("p", error.message, { class: "error" }));
  } finally {
    if (button) button.disabled = false;
  }
}

function showResult(data) {
  const result = document.querySelector("#result");
  const blocks = [
    text("h2", "Your packet is ready"),
    text("p", data.disclaimer),
  ];
  if (data.file) {
    blocks.push(el("a", { class: "primary", href: data.file, target: "_blank", rel: "noopener" }, ["Open the mail packet (PDF)"]));
  }
  const list = el("div", { class: "channels" });
  for (const channel of data.channels) {
    const card = el("article", { class: channel.recommended ? "channel recommended" : "channel" });
    if (channel.recommended) card.append(text("div", "Works without the website", { class: "kicker" }));
    card.append(text("h3", channel.title));
    card.append(text("p", channel.detail));
    if (channel.url) card.append(el("a", { href: channel.url, target: "_blank", rel: "noopener" }, ["Official page"]));
    if (channel.phone) card.append(text("p", `Phone: ${channel.phone}`));
    list.append(card);
  }
  blocks.push(list);
  for (const desk of data.destinations) {
    const box = el("article", { class: "dest" });
    box.append(text("h3", desk.role === "primary" ? "Mail this office" : "Also mail this office"));
    box.append(text("p", desk.why));
    box.append(text("pre", desk.address, { class: "address" }));
    if (!desk.knownAddress) box.append(text("p", "This county's street address is not in the directory. Call the phone number and ask them to read the mailing address, then write it on the envelope."));
    blocks.push(box);
  }
  const steps = document.createElement("ol");
  for (const item of data.checklist) steps.append(text("li", item));
  blocks.push(text("h3", "Checklist"));
  blocks.push(steps);
  if (data.localNote) blocks.push(el("div", { class: "note" }, [text("p", data.localNote)]));
  result.replaceChildren(...blocks);
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function render() {
  const stateSelect = el("select", {
    id: "code",
    onchange: async (event) => {
      form.code = event.target.value;
      const response = await fetch(`/api/records/jurisdictions/${form.code}`);
      detail = await response.json();
      const countyNames = new Set((detail.counties || []).map((item) => item.name));
      if (form.county && !countyNames.has(form.county)) form.county = "";
      render();
    },
  });
  for (const item of directory) {
    const option = el("option", { value: item.code }, [item.name]);
    if (item.code === form.code) option.selected = true;
    stateSelect.append(option);
  }

  const types = el("div", { class: "choices" });
  const typeMeta = [
    ["birth", "Birth"],
    ["marriage", "Marriage"],
    ["divorce", "Divorce"],
    ["death", "Death"],
    ["adoption", "Adoption"],
    ["driver", "Driver record"],
  ];
  for (const [id, label] of typeMeta) {
    types.append(el("button", {
      type: "button",
      class: "choice",
      "aria-pressed": form.recordType === id ? "true" : "false",
      onclick: () => {
        form.recordType = id;
        render();
      },
    }, [label]));
  }

  const reasons = el("div", { class: "checks" });
  for (const [id, label] of REASONS) {
    const input = el("input", { type: "checkbox" });
    input.checked = form.obstacles.includes(id);
    input.addEventListener("change", () => {
      form.obstacles = input.checked
        ? [...new Set([...form.obstacles, id])]
        : form.obstacles.filter((item) => item !== id);
      if (["marriage", "divorce", "adoption", "court_order"].includes(id) && input.checked) {
        form.nameChangeReason = id === "court_order" ? "court" : id;
      }
    });
    reasons.append(el("label", { class: "check" }, [input, el("span", {}, [label])]));
  }

  const countyField = detail?.counties?.length
    ? (() => {
      const select = el("select", {
        id: "county",
        onchange: (event) => { form.county = event.target.value; },
      });
      select.append(el("option", { value: "" }, ["County not sure yet"]));
      for (const county of detail.counties) {
        const option = el("option", { value: county.name }, [`${county.name} County`]);
        if (county.name === form.county) option.selected = true;
        select.append(option);
      }
      return el("label", {}, [text("span", "County where it happened"), select]);
    })()
    : field("County, parish, or town", "county", { placeholder: "Where the license or event was filed" });

  const sheet = el("form", { onsubmit: buildPacket }, [
    text("h2", "The person and the event"),
    el("div", { class: "note" }, [
      text("p", "Put every name the clerk might have indexed. A marriage, divorce, adoption, or court order often files the record under a surname that is not on your ID."),
    ]),
    field("Current legal name", "legalName", { placeholder: "Name you use now", autocomplete: "name" }),
    field("Name on the record, if different", "nameAtEvent", { placeholder: "Surname before marriage, or name at birth" }),
    field("Any other names, separated by commas", "priorNames", { placeholder: "Earlier married names, adoptive name, name on the court order" }),
    el("div", { class: "row" }, [
      field("Date of the event", "eventDate", { placeholder: "MM/DD/YYYY" }),
      field("Or just the year", "eventYear", { placeholder: "1984" }),
    ]),
    field("City or town", "eventCity", { placeholder: "City of birth, marriage, or court" }),
    countyField,
    form.recordType === "marriage" || form.recordType === "divorce"
      ? field("Other spouse, including a former surname", "spouseName")
      : text("span", ""),
    form.recordType === "birth" || form.recordType === "adoption" || form.recordType === "death"
      ? field("Parent names, including a surname before marriage", "parentNames")
      : text("span", ""),
    field("Your date of birth", "dob", { placeholder: "Needed for driver records and helpful for every search" }),
    field("Why you need it", "purpose", { placeholder: "Passport, Social Security, benefits, school" }),
    text("h2", "Where should they mail the record?"),
    field("Street address", "address1", { autocomplete: "address-line1" }),
    field("Apartment, unit, or box", "address2", { autocomplete: "address-line2" }),
    el("div", { class: "row" }, [
      field("City", "city", { autocomplete: "address-level2" }),
      field("State", "region", { autocomplete: "address-level1", placeholder: "CA" }),
    ]),
    el("div", { class: "row" }, [
      field("ZIP", "zip", { autocomplete: "postal-code" }),
      field("Phone", "phone", { autocomplete: "tel" }),
    ]),
    field("Email", "email", { autocomplete: "email" }),
    el("button", { class: "primary", type: "submit" }, ["Build my mail packet"]),
  ]);

  const aside = el("section", { class: "card" }, [
    text("h2", "What is in the way?"),
    text("p", "Check everything that is true. The letter tells the clerk to search the old name, and it keeps a mail path when the county has no portal."),
    reasons,
    detail ? el("div", { class: "note" }, [
      text("p", detail.records[form.recordType]?.localNote || detail.vital.paymentNote),
      text("p", `Office phone: ${detail.vital.phone || "see the official page"}`),
    ]) : text("p", ""),
    el("div", { id: "result" }),
  ]);

  app.replaceChildren(
    el("section", { class: "hero" }, [
      text("h1", "Get the record, even when the website will not."),
      text("p", "Birth, marriage, divorce, adoption, and driver records are filed under the name in use at the time. If a state or county has no online order, this builds the letter, the checklist, and the envelope.", { class: "lede" }),
    ]),
    el("section", { class: "grid" }, [
      el("div", { class: "card" }, [
        text("h2", "Where did it happen?"),
        el("label", {}, [text("span", "State or city"), stateSelect]),
        text("label", "Record"),
        types,
        sheet,
      ]),
      aside,
    ])
  );
}

load().catch((error) => {
  app.replaceChildren(text("p", error.message, { class: "error" }));
});
