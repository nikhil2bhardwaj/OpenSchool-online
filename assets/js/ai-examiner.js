/* ==========================================================================
   OpenSchool NCERT - AI Examiner / Viva-Voce Engine
   assets/js/ai-examiner.js
   Zero external dependencies. Dual-mode:
     Mode 1 (Static Offline): pre-seeded viva bank + deterministic grading.
     Mode 2 (AI Examiner):    local Ollama streaming OR user-supplied cloud key.
   ========================================================================== */

(function (global) {
  "use strict";

  const SI = "You are a strict, experienced CBSE Senior Secondary External Examiner " +
    "conducting a practical viva-voce for a school science laboratory. Address the " +
    "student directly and professionally. Ask ONE focused question at a time. After the " +
    "student answers, award a mark out of 2, briefly state what was correct and what was " +
    "missing, then move on. Ground every question in the student's recorded readings and " +
    "computed results when they are supplied; probe sources of error, precautions, and " +
    "the underlying theory. Never invent experimental data. Keep each reply under 120 words.";

  function normalize(s) {
    return String(s == null ? "" : s)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(s) { return normalize(s).split(" ").filter(Boolean); }

  function uid(prefix) {
    return (prefix || "viva") + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  class AIExaminer {
    /**
     * @param {Object} config
     * @param {string} config.experimentId
     * @param {string} [config.experimentTitle]
     * @param {string} [config.subject]
     * @param {string|number} [config.classLevel]
     * @param {Array}  [config.vivaBank]      [{question, answer, keywords?}]
     * @param {Function} [config.getObservations] returns array/object of readings from DOM
     * @param {Function} [config.onToken]
     * @param {Function} [config.onMessage]
     * @param {Function} [config.onError]
     * @param {Function} [config.onScore]
     */
    constructor(config) {
      config = config || {};
      this.experimentId = config.experimentId || "unknown_experiment";
      this.experimentTitle = config.experimentTitle || this.experimentId;
      this.subject = config.subject || "science";
      this.classLevel = config.classLevel != null ? config.classLevel : "";
      this.vivaBank = Array.isArray(config.vivaBank) ? config.vivaBank : [];
      this.getObservations = typeof config.getObservations === "function" ? config.getObservations : function () { return []; };
      this.onToken = config.onToken || function () {};
      this.onMessage = config.onMessage || function () {};
      this.onError = config.onError || function () {};
      this.onScore = config.onScore || function () {};

      this.mode = "offline";
      this.provider = "ollama"; // ollama | openai | anthropic
      this.model = "";
      this.apiKey = "";
      this.endpoint = "";
      this.messages = [];
      this._active = null;
      this.offline = { index: 0, answers: [], score: 0, total: this.vivaBank.length * 2 };
    }

    /* ------------------------------------------------------------------ */
    /* Configuration                                                       */
    /* ------------------------------------------------------------------ */
    setMode(mode) {
      this.mode = mode === "ai" ? "ai" : "offline";
      return this.mode;
    }

    configure(opts) {
      opts = opts || {};
      if (opts.provider) this.provider = opts.provider;
      if (opts.model) this.model = opts.model;
      if (opts.apiKey) this.apiKey = opts.apiKey;
      if (opts.endpoint) this.endpoint = opts.endpoint;
      return this;
    }

    setVivaBank(bank) { this.vivaBank = Array.isArray(bank) ? bank : []; this.offline.total = this.vivaBank.length * 2; return this; }

    /* ------------------------------------------------------------------ */
    /* Observation harvesting                                              */
    /* ------------------------------------------------------------------ */
    collectObservations() {
      try {
        const obs = this.getObservations();
        return Array.isArray(obs) ? obs : (obs == null ? [] : [obs]);
      } catch (e) {
        return [];
      }
    }

    buildContextBlock() {
      const obs = this.collectObservations();
      const lines = obs.map(function (r, i) {
        if (typeof r === "string") return (i + 1) + ". " + r;
        return (i + 1) + ". " + Object.keys(r).map(function (k) { return k + "=" + r[k]; }).join(", ");
      });
      return "Experiment: " + this.experimentTitle + "\n" +
        "Class: " + this.classLevel + " | Subject: " + this.subject + "\n" +
        "Student recorded observations:\n" + (lines.length ? lines.join("\n") : "(no readings recorded yet)");
    }

    /* ------------------------------------------------------------------ */
    /* MODE 1: Static offline viva                                         */
    /* ------------------------------------------------------------------ */
    offlineStart() {
      this.setMode("offline");
      this.offline = { index: 0, answers: [], score: 0, total: this.vivaBank.length * 2 };
      return this.offlineQuestion();
    }

    offlineQuestion() {
      if (this.offline.index >= this.vivaBank.length) return null;
      const q = this.vivaBank[this.offline.index];
      return { index: this.offline.index, total: this.vivaBank.length, question: q.question };
    }

    scoreAnswer(questionText, modelAnswer, userAnswer) {
      const correct = tokenize(userAnswer);
      if (!correct.length) return { mark: 0, matched: [], missing: [] };
      const keySource = (modelAnswer || questionText || "");
      const keys = tokenize(keySource).filter(function (w) { return w.length > 3; });
      const uniq = Array.from(new Set(keys));
      const matched = uniq.filter(function (k) { return correct.indexOf(k) !== -1; });
      const missing = uniq.filter(function (k) { return correct.indexOf(k) === -1; }).slice(0, 8);
      const ratio = uniq.length ? matched.length / uniq.length : 0;
      const mark = ratio >= 0.55 ? 2 : ratio >= 0.3 ? 1 : 0;
      return { mark: mark, matched: matched, missing: missing };
    }

    offlineSubmit(userAnswer) {
      if (this.offline.index >= this.vivaBank.length) return null;
      const q = this.vivaBank[this.offline.index];
      const graded = this.scoreAnswer(q.question, q.answer, userAnswer || "");
      this.offline.answers.push({ question: q.question, answer: userAnswer || "", mark: graded.mark, model: q.answer });
      this.offline.score += graded.mark;
      this.offline.index += 1;
      const done = this.offline.index >= this.vivaBank.length;
      const result = {
        question: q.question, model: q.answer, mark: graded.mark, max: 2,
        matched: graded.matched, missing: graded.missing, done: done,
        next: done ? null : this.offlineQuestion(),
        score: this.offline.score, total: this.offline.total
      };
      this.onScore(result);
      return result;
    }

    /* ------------------------------------------------------------------ */
    /* MODE 2: AI examiner (streaming)                                     */
    /* ------------------------------------------------------------------ */
    async aiStart(extraInstruction) {
      this.setMode("ai");
      this.messages = [
        { role: "system", content: SI + "\n\n" + this.buildContextBlock() }
      ];
      const opening = extraInstruction ||
        "Begin the viva now. Greet the student briefly, then ask your first viva question based on the recorded experiment.";
      return this.aiSend(opening);
    }

    async aiSend(userText) {
      this.messages.push({ role: "user", content: userText });
      const reply = { content: "", raw: null };
      const self = this;
      const onDelta = function (chunk) {
        reply.content += chunk;
        self.onToken(chunk, reply.content);
      };
      try {
        if (this.provider === "ollama") {
          reply.raw = await this._streamOllama(onDelta);
        } else if (this.provider === "anthropic") {
          reply.raw = await this._streamAnthropic(onDelta);
        } else {
          reply.raw = await this._streamOpenAI(onDelta);
        }
        this.messages.push({ role: "assistant", content: reply.content });
        this.onMessage(reply.content, reply);
        return reply;
      } catch (e) {
        const msg = "AI examiner connection failed: " + (e && e.message ? e.message : e) +
          ". You can continue in Offline Viva mode.";
        this.onError(e);
        this.onMessage(msg, { error: true });
        return { content: msg, error: true };
      }
    }

    _defaultEndpoint() {
      if (this.provider === "ollama") return this.endpoint || "http://localhost:11434";
      if (this.provider === "anthropic") return this.endpoint || "https://api.anthropic.com";
      return this.endpoint || "https://api.openai.com";
    }

    _model() {
      if (this.model) return this.model;
      if (this.provider === "ollama") return "llama3.1";
      if (this.provider === "anthropic") return "claude-3-5-sonnet-20240620";
      return "gpt-4o-mini";
    }

    async _readStream(response, onLine) {
      if (!response.ok) {
        const text = await response.text().catch(function () { return ""; });
        throw new Error("HTTP " + response.status + (text ? " — " + text.slice(0, 180) : ""));
      }
      if (!response.body || !response.body.getReader) {
        const text = await response.text();
        onLine(text);
        return text;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const res = await reader.read();
        if (res.done) break;
        buffer += decoder.decode(res.value, { stream: true });
        let nl;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (line) onLine(line);
        }
      }
      if (buffer.trim()) onLine(buffer.trim());
      return true;
    }

    async _streamOllama(onDelta) {
      const url = this._defaultEndpoint().replace(/\/+$/, "") + "/api/chat";
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this._model(), messages: this.messages, stream: true })
      });
      await this._readStream(response, function (line) {
        try {
          const obj = JSON.parse(line);
          const piece = obj.message && obj.message.content ? obj.message.content : (obj.response || "");
          if (piece) onDelta(piece);
        } catch (e) { /* partial line */ }
      });
      return true;
    }

    async _streamOpenAI(onDelta) {
      const url = this._defaultEndpoint().replace(/\/+$/, "") + "/v1/chat/completions";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + this.apiKey
        },
        body: JSON.stringify({ model: this._model(), messages: this.messages, stream: true })
      });
      await this._readStream(response, function (line) {
        const payload = line.indexOf("data:") === 0 ? line.slice(5).trim() : line;
        if (!payload || payload === "[DONE]") return;
        try {
          const obj = JSON.parse(payload);
          const piece = obj.choices && obj.choices[0] && obj.choices[0].delta && obj.choices[0].delta.content;
          if (piece) onDelta(piece);
        } catch (e) { /* ignore */ }
      });
      return true;
    }

    async _streamAnthropic(onDelta) {
      const url = this._defaultEndpoint().replace(/\/+$/, "") + "/v1/messages";
      const system = this.messages.filter(function (m) { return m.role === "system"; }).map(function (m) { return m.content; }).join("\n\n");
      const convo = this.messages.filter(function (m) { return m.role !== "system"; });
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({ model: this._model(), max_tokens: 700, system: system, messages: convo, stream: true })
      });
      await this._readStream(response, function (line) {
        const payload = line.indexOf("data:") === 0 ? line.slice(5).trim() : line;
        if (!payload || payload === "[DONE]") return;
        try {
          const obj = JSON.parse(payload);
          if (obj.type === "content_block_delta" && obj.delta && obj.delta.text) onDelta(obj.delta.text);
        } catch (e) { /* ignore */ }
      });
      return true;
    }

    /* ------------------------------------------------------------------ */
    /* Persistence helper                                                  */
    /* ------------------------------------------------------------------ */
    async saveResults() {
      if (!global.LabNotebook) return null;
      const transcript = this.offline.answers.length
        ? this.offline.answers
        : this.messages.map(function (m) { return { role: m.role, content: m.content }; });
      return global.LabNotebook.saveViva(this.experimentId, {
        viva_id: uid("viva"),
        score: this.offline.answers.length ? this.offline.score : null,
        total: this.offline.answers.length ? this.offline.total : null,
        transcript: transcript,
        mode: this.mode
      });
    }
  }

  global.AIExaminer = AIExaminer;
  if (typeof module !== "undefined" && module.exports) module.exports = AIExaminer;
})(typeof window !== "undefined" ? window : this);
