// One script for the whole site. Each feature only runs on the page that has its elements.
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  /* ---------- Shared: footer year, menu, greeting, scroll reveal ---------- */
  var yearEl = $("year");
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  var toggle = $("menu-toggle");
  var menu = $("nav-links");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  var greeting = $("greeting");
  if (greeting) {
    var h = new Date().getHours();
    var part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    greeting.textContent = part + ", and welcome.";
  }

  var blocks = document.querySelectorAll(".block");
  if ("IntersectionObserver" in window && blocks.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    blocks.forEach(function (b) { b.classList.add("reveal"); io.observe(b); });
  }

  /* ---------- Academic planner ---------- */
  var taskForm = $("task-form");
  if (taskForm) {
    var KEY = "academicPlannerTasks";
    var tasks = [];
    var filter = "all";
    var input = $("task-input");
    var errorEl = $("task-error");
    var listEl = $("task-list");
    var countEl = $("task-count");
    var barEl = $("progress-bar");

    var save = function () {
      try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) { /* storage blocked */ }
    };

    try {
      var stored = localStorage.getItem(KEY);
      tasks = stored ? JSON.parse(stored) : [];
    } catch (e) { tasks = []; }
    if (!Array.isArray(tasks)) { tasks = []; }

    var render = function () {
      listEl.innerHTML = "";
      var shown = tasks.filter(function (t) {
        return filter === "all" || (filter === "done" ? t.done : !t.done);
      });

      if (!shown.length) {
        var empty = document.createElement("li");
        empty.className = "empty";
        empty.textContent = tasks.length ? "Nothing in this view." : "No tasks yet. Add your first one above.";
        listEl.appendChild(empty);
      }

      shown.forEach(function (task) {
        var li = document.createElement("li");
        if (task.done) { li.className = "done"; }

        var box = document.createElement("input");
        box.type = "checkbox";
        box.checked = task.done;
        box.setAttribute("aria-label", "Mark as completed: " + task.text);
        box.addEventListener("change", function () { task.done = box.checked; save(); render(); });

        var label = document.createElement("span");
        label.textContent = task.text; // textContent keeps user text from being treated as HTML

        var del = document.createElement("button");
        del.type = "button";
        del.className = "btn-del";
        del.textContent = "Delete";
        del.setAttribute("aria-label", "Delete task: " + task.text);
        del.addEventListener("click", function () {
          tasks = tasks.filter(function (t) { return t.id !== task.id; });
          save(); render();
        });

        li.appendChild(box); li.appendChild(label); li.appendChild(del);
        listEl.appendChild(li);
      });

      var done = tasks.filter(function (t) { return t.done; }).length;
      countEl.textContent = tasks.length ? done + " of " + tasks.length + " tasks completed" : "";
      barEl.style.width = tasks.length ? Math.round((done / tasks.length) * 100) + "%" : "0%";
      $("clear-done").disabled = done === 0;
    };

    taskForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) {
        errorEl.textContent = "Please type a task before adding.";
        input.classList.add("invalid");
        input.focus();
        return;
      }
      errorEl.textContent = "";
      input.classList.remove("invalid");
      tasks.push({ id: Date.now(), text: text, done: false });
      input.value = "";
      save(); render();
      input.focus();
    });

    $("filters").addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-filter]");
      if (!btn) { return; }
      filter = btn.getAttribute("data-filter");
      document.querySelectorAll("#filters button").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      render();
    });

    $("clear-done").addEventListener("click", function () {
      tasks = tasks.filter(function (t) { return !t.done; });
      save(); render();
    });

    render();
  }

  /* ---------- Contact form validation ---------- */
  var contactForm = $("contact-form");
  if (contactForm) {
    var fields = { name: $("name"), email: $("email"), phone: $("phone"), message: $("message") };
    var success = $("form-success");

    var check = function (key) {
      var v = fields[key].value.trim();
      if (v === "") { return "This field cannot be empty."; }
      if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        return "Enter a valid email address, for example name@example.com.";
      }
      if (key === "phone" && !/^[0-9]+$/.test(v)) {
        return "Phone number must contain digits only (0-9).";
      }
      return "";
    };

    var show = function (key) {
      var msg = check(key);
      $(key + "-error").textContent = msg;
      fields[key].classList.toggle("invalid", msg !== "");
      fields[key].classList.toggle("valid", msg === "");
      fields[key].setAttribute("aria-invalid", msg !== "" ? "true" : "false");
      return msg === "";
    };

    Object.keys(fields).forEach(function (key) {
      fields[key].addEventListener("blur", function () { show(key); });
      fields[key].addEventListener("input", function () {
        if (fields[key].classList.contains("invalid")) { show(key); }
      });
    });

    fields.message.addEventListener("input", function () {
      $("char-count").textContent = fields.message.value.length + " / 500";
    });

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      success.textContent = "";
      var ok = true;
      var firstBad = null;
      Object.keys(fields).forEach(function (key) {
        if (!show(key)) { ok = false; if (!firstBad) { firstBad = fields[key]; } }
      });
      if (!ok) { firstBad.focus(); return; }
      var first = fields.name.value.trim().split(" ")[0];
      success.textContent = "Thank you, " + first + ". Your message has been validated and sent.";
      contactForm.reset();
      $("char-count").textContent = "0 / 500";
      Object.keys(fields).forEach(function (key) {
        fields[key].classList.remove("valid", "invalid");
        fields[key].removeAttribute("aria-invalid");
      });
    });
  }

  /* ---------- Password strength checker ---------- */
  var pw = $("pw-input");
  if (pw) {
    var COMMON = ["password", "123456", "qwerty", "admin", "letmein", "welcome", "iloveyou", "abc123", "football", "monkey", "dragon", "login", "naija", "nigeria"];
    var rules = {
      length: function (s) { return s.length >= 12; },
      upper: function (s) { return /[A-Z]/.test(s); },
      lower: function (s) { return /[a-z]/.test(s); },
      number: function (s) { return /[0-9]/.test(s); },
      symbol: function (s) { return /[^A-Za-z0-9]/.test(s); },
      common: function (s) {
        var low = s.toLowerCase();
        if (/^(.)\1+$/.test(s)) { return false; }               // same character repeated
        return !COMMON.some(function (w) { return low.indexOf(w) !== -1; });
      }
    };
    var labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
    var bar = $("pw-bar");
    var label = $("pw-label");
    var items = document.querySelectorAll("#pw-list li");

    var evaluate = function () {
      var s = pw.value;
      var passed = 0;
      items.forEach(function (li) {
        var ok = s.length > 0 && rules[li.getAttribute("data-rule")](s);
        li.classList.toggle("ok", ok);
        if (ok) { passed++; }
      });

      var level = 0;
      if (s.length) {
        level = passed <= 2 ? 1 : passed <= 4 ? 2 : passed === 5 ? 3 : 4;
        if (s.length < 8) { level = Math.min(level, 1); }
        if (!rules.common(s)) { level = Math.min(level, 1); }
      }
      bar.style.width = (level * 25) + "%";
      bar.setAttribute("data-level", String(level));
      label.textContent = s.length ? "Strength: " + labels[level] : "Start typing to check strength.";
    };

    pw.addEventListener("input", evaluate);
    $("pw-toggle").addEventListener("change", function (e) {
      pw.type = e.target.checked ? "text" : "password";
    });
    evaluate();
  }
})();
