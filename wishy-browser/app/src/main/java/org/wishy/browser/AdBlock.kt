package org.wishy.browser

/**
 * Ad requests that live on hosts too useful to block outright (YouTube, Google, Facebook, X), so the host blocklist
 * cannot catch them. Matched by host and path. Anything uncertain is left out: a wrong rule breaks a page, a missing
 * one only lets a tracker through (the page-side layer in adblock.js still catches the visible ad).
 *
 * Plain Kotlin on purpose (strings in, boolean out, no android.net.Uri): tools/adblock-test checks it on a normal JVM.
 */
object AdRules {
    private class P(val path: String, val query: String? = null, val exact: Boolean = false) {
        fun hit(p: String, q: String?): Boolean {
            val pathOk = if (exact) p == path || p == "$path/" else p.contains(path)
            return pathOk && (query == null || (q != null && q.contains(query)))
        }
    }

    private val YT_HOSTS = listOf("youtube.com", "youtube-nocookie.com", "youtubekids.com")

    /** YouTube's own ad and ad-measurement endpoints. */
    private val YT = listOf(
        P("/api/stats/ads"), P("/pagead/"), P("/ptracking"), P("/get_midroll_"),
        P("/youtubei/v1/player/ad_break"), P("/api/stats/qoe", query = "adformat="),
    )

    private val BY_HOST: Map<String, List<P>> = mapOf(
        "google.com" to listOf(P("/pagead/"), P("/ads/ga-audiences"), P("/ads/measurement")),
        "facebook.com" to listOf(P("/tr", exact = true)),                 // the Meta pixel
        "connect.facebook.net" to listOf(P("/fbevents.js")),
        "twitter.com" to listOf(P("/i/adsct")),
        "x.com" to listOf(P("/i/adsct")),
    )

    /** Google's ad paths, wherever they are served from. */
    private val ANYWHERE = listOf(
        P("/pagead/"), P("/gampad/ads"), P("/pcs/activeview"), P("/gpt/pubads_impl"), P("/tag/js/gpt.js"),
        P("/popunder"), P("/pop.js"), P("/pu.js"), P("/adclick"), P("/vast.xml"), P("/vpaid"),
    )

    /** Known popunder, clickjacking, and aggressive ad-redirect domains. */
    private val POPUP_HOSTS = setOf(
        "popads.net", "popcash.net", "propellerads.com", "propu.sh", "monetag.com",
        "exoclick.com", "exosrv.com", "realsrv.com", "syndication.exoclick.com",
        "trafficjunky.net", "trafficjunky.com", "juicyads.com", "adsterra.com",
        "highperformanceformat.com", "effectivegatecpm.com", "topcreativeformat.com",
        "hilltopads.net", "clickadu.com", "adspyglass.com", "tsyndicate.com",
        "traffichunt.com", "trafficfactory.biz", "ad-maven.com", "admaven.com",
        "onclickalgo.com", "a-ads.com", "acscdn.com", "twinrdsrv.com",
        "doubleclick.net", "googlesyndication.com", "googleadservices.com",
        "adservice.google.com", "taboola.com", "outbrain.com", "mgid.com",
        "adf.ly", "bc.vc", "ouo.io", "shrinkme.io", "linkvertise.com"
    )

    private fun isYouTube(host: String) = YT_HOSTS.any { host == it || host.endsWith(".$it") }

    private fun matchesDomainSet(hostLc: String, set: Set<String>): Boolean {
        var h = hostLc
        while (true) {
            if (h in set) return true
            val dot = h.indexOf('.')
            if (dot < 0) break
            h = h.substring(dot + 1)
        }
        return false
    }

    /**
     * @param host the request's host, @param encodedPath and @param encodedQuery as Uri.getEncodedPath()/getEncodedQuery().
     * @param youtube the "Block YouTube ads" switch, @param other the "Block ads and trackers" switch.
     */
    fun matches(host: String?, encodedPath: String?, encodedQuery: String?, youtube: Boolean, other: Boolean): Boolean {
        val hostLc = host?.lowercase() ?: return false
        val path = encodedPath ?: ""
        if (youtube && isYouTube(hostLc) && YT.any { it.hit(path, encodedQuery) }) return true
        if (!other) return false
        if (matchesDomainSet(hostLc, POPUP_HOSTS)) return true
        var h = hostLc
        while (true) {
            BY_HOST[h]?.let { rules -> if (rules.any { it.hit(path, encodedQuery) }) return true }
            val dot = h.indexOf('.')
            if (dot < 0) break
            h = h.substring(dot + 1)
        }
        return ANYWHERE.any { it.hit(path, encodedQuery) }
    }

    /** True when a popup or navigation target looks like an ad, popunder, or redirect network. */
    fun isPopupOrAdRedirect(host: String?, encodedPath: String?, encodedQuery: String?): Boolean {
        val hostLc = host?.lowercase() ?: return false
        if (matchesDomainSet(hostLc, POPUP_HOSTS)) return true
        val path = (encodedPath ?: "").lowercase()
        val query = (encodedQuery ?: "").lowercase()
        if (ANYWHERE.any { it.hit(path, encodedQuery) }) return true
        return path.contains("popunder") || path.contains("/afu.php") ||
            query.contains("clickid=") && query.contains("zoneid=") ||
            query.contains("popunder=")
    }

    /** YouTube's JSON endpoints get "{}" back instead of nothing, so its player does not stall on a parse error. */
    fun wantsJson(encodedPath: String?): Boolean = (encodedPath ?: "").startsWith("/youtubei/")
}
