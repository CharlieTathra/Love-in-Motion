"use strict";

(function (global) {
  var PREFIX = "limn_";
  var DEVICE_KEY = "limn_device_id";
  var SYNC_TS_KEY = "limn_sync_updated_at";
  var TABLE = "lim_app_state";
  var DEFAULT_SCOPE_PREFIX = "love-in-motion";
  var FLUSH_DEBOUNCE_MS = 700;

  function safeJSONParse(raw) {
    if (raw === null || raw === undefined) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function clone(value) {
    return value === null || value === undefined ? value : JSON.parse(JSON.stringify(value));
  }

  function randomId() {
    try {
      if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    } catch (e) {}
    return "limn_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function getDeviceId() {
    try {
      var existing = global.localStorage.getItem(DEVICE_KEY);
      if (existing) return existing;
      var created = randomId();
      global.localStorage.setItem(DEVICE_KEY, created);
      return created;
    } catch (e) {
      return "memory";
    }
  }

  function readLocalSnapshot(localOk) {
    var out = {};
    if (!localOk) return out;
    try {
      for (var i = 0; i < global.localStorage.length; i++) {
        var key = global.localStorage.key(i);
        if (!key || key.indexOf(PREFIX) !== 0) continue;
        out[key] = safeJSONParse(global.localStorage.getItem(key));
      }
    } catch (e) {}
    return out;
  }

  function writeLocal(localOk, key, value, mem) {
    try {
      if (localOk) global.localStorage.setItem(key, JSON.stringify(value));
      else mem[key] = value;
    } catch (e) {
      mem[key] = value;
    }
  }

  function readLocal(localOk, key, mem) {
    try {
      if (localOk) return safeJSONParse(global.localStorage.getItem(key));
      return mem[key];
    } catch (e) {
      return mem[key];
    }
  }

  function removeLocal(localOk, key, mem) {
    try {
      if (localOk) global.localStorage.removeItem(key);
      delete mem[key];
    } catch (e) {
      delete mem[key];
    }
  }

  function readSyncTimestamp(localOk) {
    if (!localOk) return "";
    try { return global.localStorage.getItem(SYNC_TS_KEY) || ""; }
    catch (e) { return ""; }
  }

  function writeSyncTimestamp(localOk, ts) {
    if (!localOk) return;
    try { global.localStorage.setItem(SYNC_TS_KEY, ts); } catch (e) {}
  }

  function replaceSnapshot(snapshot, nextPayload) {
    Object.keys(snapshot).forEach(function (key) { delete snapshot[key]; });
    if (!nextPayload || typeof nextPayload !== "object") return;
    Object.keys(nextPayload).forEach(function (key) { snapshot[key] = nextPayload[key]; });
  }

  function createStore(scopeName, onRemoteSync) {
    var mem = {};
    var localOk = false;
    try {
      global.localStorage.setItem("__t", "1");
      global.localStorage.removeItem("__t");
      localOk = true;
    } catch (e) {
      localOk = false;
    }

    /* Default scope is per-device unless LIM_SUPABASE_SCOPE is explicitly set. */
    var scope = global.LIM_SUPABASE_SCOPE ||
      (DEFAULT_SCOPE_PREFIX + ":" + (scopeName || "default") + ":" + getDeviceId());
    var supabaseUrl = global.LIM_SUPABASE_URL || "";
    var supabaseKey = global.LIM_SUPABASE_ANON_KEY || "";
    var enabled = !!(supabaseUrl && supabaseKey && global.fetch);
    var snapshot = readLocalSnapshot(localOk);
    var syncUpdatedAt = readSyncTimestamp(localOk);
    var flushTimer = null;
    var baseUrl = supabaseUrl.replace(/\/+$/, "");

    function flushRemote() {
      if (!enabled) return Promise.resolve();
      var now = new Date().toISOString();
      syncUpdatedAt = now;
      writeSyncTimestamp(localOk, syncUpdatedAt);
      return global.fetch(
        baseUrl + "/rest/v1/" + TABLE + "?on_conflict=scope",
        {
          method: "POST",
          headers: {
            "apikey": supabaseKey,
            "Authorization": "Bearer " + supabaseKey,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal"
          },
          body: JSON.stringify([{
            scope: scope,
            payload: snapshot,
            updated_at: now
          }])
        }
      ).catch(function () {});
    }

    function scheduleFlush() {
      if (!enabled) return;
      if (flushTimer) global.clearTimeout(flushTimer);
      flushTimer = global.setTimeout(function () {
        flushTimer = null;
        flushRemote();
      }, FLUSH_DEBOUNCE_MS);
    }

    if (enabled) {
      global.fetch(
        baseUrl + "/rest/v1/" + TABLE +
          "?select=payload,updated_at&scope=eq." + encodeURIComponent(scope) + "&limit=1",
        {
          headers: {
            "apikey": supabaseKey,
            "Authorization": "Bearer " + supabaseKey
          }
        }
      )
      .then(function (res) { return res.ok ? res.json() : []; })
      .then(function (rows) {
        var remote = rows && rows[0];
        var remoteUpdatedAt = remote && remote.updated_at ? String(remote.updated_at) : "";
        var payload = remote && remote.payload;
        var localDate = new Date(syncUpdatedAt || "1970-01-01T00:00:00.000Z");
        if (remoteUpdatedAt &&
            new Date(remoteUpdatedAt) > localDate &&
            payload && typeof payload === "object") {
          var previousKeys = Object.keys(snapshot);
          replaceSnapshot(snapshot, payload);
          previousKeys.forEach(function (k) {
            if (!(k in snapshot)) removeLocal(localOk, k, mem);
          });
          Object.keys(snapshot).forEach(function (k) {
            writeLocal(localOk, k, snapshot[k], mem);
          });
          syncUpdatedAt = remoteUpdatedAt;
          writeSyncTimestamp(localOk, syncUpdatedAt);
          if (typeof onRemoteSync === "function") onRemoteSync();
        }
      })
      .catch(function () {});
    }

    return {
      get: function (key) {
        if (key in snapshot) return clone(snapshot[key]);
        return clone(readLocal(localOk, key, mem));
      },
      set: function (key, value) {
        var next = clone(value);
        snapshot[key] = next;
        writeLocal(localOk, key, next, mem);
        scheduleFlush();
      },
      flush: flushRemote
    };
  }

  global.LIMStorage = { create: createStore };
})(window);
