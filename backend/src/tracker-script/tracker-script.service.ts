import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TrackerScriptService {
  constructor(private readonly config: ConfigService) {}

  getScript(): string {
    const baseUrl = this.config.get<string>('TRACKER_BASE_URL') || 'http://localhost:3001';

    return `(function (w, d, g, k) {
  var TK_BASE = "${baseUrl}";
  var secure = w.location.protocol === "https:" ? "secure; " : "";

  function getCid() {
    var m = d.cookie.match(/(^| )tk-cid=([^;]+)/);
    if (m) return m[2];
    var exp = g.getItem("tk-cid-expires");
    if (exp && +exp > Date.now()) return g.getItem("tk-cid");
    return null;
  }

  function saveCid(cid) {
    var h = new Date();
    h.setTime(h.getTime() + 86400000);
    d.cookie = "tk-cid=" + cid + "; " + secure + "samesite=Strict; expires=" + h.toUTCString() + "; path=/";
    g.setItem("tk-cid", cid);
    g.setItem("tk-cid-expires", h.getTime());
  }

  function urlParams() {
    var p = {};
    new URLSearchParams(w.location.search).forEach(function (v, key) {
      p[key] = v;
    });
    return p;
  }

  function currentScript() {
    var scripts = d.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  }

  function registerDirectVisit(campaignId) {
    if (!campaignId || getCid()) return;
    var params = urlParams();
    fetch(TK_BASE + "/t/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign: campaignId, params: params }),
      keepalive: true,
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.clickId) saveCid(data.clickId);
      })
      .catch(function () {});
  }

  w.tkCallback = w.tkCallback || function () {};
  w.tkCallback.state = w.tkCallback.state || { callbackQueue: [] };

  w.tkCallback.registerConversion = function (meta) {
    w.tkCallback.state.callbackQueue.push(meta || {});
    var cid = getCid();
    if (!cid) return;
    fetch(TK_BASE + "/conversions/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clickId: cid, eventType: "lead", metadata: meta || {} }),
      keepalive: true,
    }).catch(function () {});
  };

  w.dtpCallback = w.tkCallback;

  (function init() {
    var params = new URLSearchParams(w.location.search);
    var urlCid = params.get("tk-cid") || params.get("click_id");
    if (urlCid) saveCid(urlCid);

    var tag = currentScript();
    var campaign = tag && tag.getAttribute("data-campaign");
    var mode = (tag && tag.getAttribute("data-mode")) || "direct";

    if (mode === "direct" && campaign && !getCid()) {
      registerDirectVisit(campaign);
    }
  })();
})(window, document, localStorage, encodeURIComponent);`;
  }

  getLpScriptSnippet(
    campaignRef: string,
    mode: 'redirect' | 'direct',
    trackerBase?: string,
  ): string {
    const baseUrl =
      trackerBase || this.config.get<string>('TRACKER_BASE_URL') || 'http://localhost:3001';
    return `<script src="${baseUrl}/t/tracker.js" data-campaign="${campaignRef}" data-mode="${mode}"></script>`;
  }
}
