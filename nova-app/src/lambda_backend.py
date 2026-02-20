import json
import os
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
import boto3

BEDROCK = boto3.client("bedrock-runtime", region_name="us-east-1")
MODEL_ID = "us.anthropic.claude-3-5-sonnet-20241022-v2:0"

TAVILY_KEY = os.environ["TAVILY_API_KEY"]
FIRECRAWL_KEY = os.environ["FIRECRAWL_API_KEY"]


# ─────────────────────────────────────────────
# 1. TAVILY — General Web Search (6 targeted queries, 180 day limit)
# ─────────────────────────────────────────────
def search_tavily(company_name):
    queries = [
        f"{company_name} company overview business model revenue",
        f"{company_name} recent news challenges opportunities 2024 2025",
        f"{company_name} Texas market competitors industry",
        f"{company_name} CEO leadership team executives",
        f"{company_name} annual revenue employees growth",
        f"{company_name} technology innovation strategy",
    ]
    results = []
    for q in queries:
        payload = json.dumps({
            "api_key": TAVILY_KEY,
            "query": q,
            "search_depth": "basic",
            "max_results": 3,
            "days": 180
        }).encode()
        req = urllib.request.Request(
            "https://api.tavily.com/search",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            for r in data.get("results", []):
                results.append(f"[Web] {r['title']}: {r['content'][:400]}")
    return "\n".join(results)


# ─────────────────────────────────────────────
# 2. SEC EDGAR — 10-K Reports (free, no key)
# ─────────────────────────────────────────────
def search_edgar(company_name):
    try:
        search_url = (
            f"https://efts.sec.gov/LATEST/search-index?q=%22{urllib.parse.quote(company_name)}%22"
            f"&forms=10-K&dateRange=custom&startdt=2023-01-01&enddt=2025-12-31"
        )
        req = urllib.request.Request(
            search_url,
            headers={"User-Agent": "TexasAM-Hackathon research@tamu.edu"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())

        hits = data.get("hits", {}).get("hits", [])
        if not hits:
            return "[SEC EDGAR] No 10-K found — likely a private company."

        filing = hits[0]["_source"]
        entity = filing.get("entity_name", company_name)
        period = filing.get("period_of_report", "unknown period")
        form_type = filing.get("form_type", "10-K")

        summary_parts = [f"[SEC EDGAR 10-K] {entity} | {form_type} | Period: {period}"]

        accession = filing.get("accession_no", "").replace("-", "")
        cik = str(filing.get("entity_id", "")).lstrip("0")
        if accession and cik:
            text_url = (
                f"https://efts.sec.gov/LATEST/search-index?q=%22{urllib.parse.quote(company_name)}%22"
                f"&forms=10-K&dateRange=custom&startdt=2024-01-01&enddt=2025-12-31"
            )
            req2 = urllib.request.Request(
                text_url,
                headers={"User-Agent": "TexasAM-Hackathon research@tamu.edu"}
            )
            with urllib.request.urlopen(req2, timeout=15) as resp2:
                data2 = json.loads(resp2.read())
                for hit in data2.get("hits", {}).get("hits", [])[:2]:
                    snippet = hit.get("highlight", {})
                    for field_snippets in snippet.values():
                        for s in field_snippets[:2]:
                            clean = s.replace("<em>", "").replace("</em>", "")
                            summary_parts.append(f"  → {clean[:400]}")

        return "\n".join(summary_parts)
    except Exception as e:
        return f"[SEC EDGAR] Error fetching 10-K: {str(e)}"


# ─────────────────────────────────────────────
# 3. FIRECRAWL — Scrape Homepage + Key Subpages (no news/press)
# ─────────────────────────────────────────────
def find_and_scrape_website(company_name, company_url=None):
    try:
        if company_url:
            root_url = company_url
        else:
            payload = json.dumps({
                "api_key": TAVILY_KEY,
                "query": f"{company_name} official website",
                "search_depth": "basic",
                "max_results": 1
            }).encode()
            req = urllib.request.Request(
                "https://api.tavily.com/search",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                results = json.loads(resp.read()).get("results", [])

            if not results:
                return "[Website] Could not find official website."

            parsed = urllib.parse.urlparse(results[0]["url"])
            root_url = f"{parsed.scheme}://{parsed.netloc}"

        # Helper to scrape a single URL
        def scrape_url(url):
            scrape_payload = json.dumps({
                "url": url,
                "formats": ["markdown"],
                "onlyMainContent": True,
            }).encode()
            scrape_req = urllib.request.Request(
                "https://api.firecrawl.dev/v1/scrape",
                data=scrape_payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {FIRECRAWL_KEY}"
                },
                method="POST"
            )
            with urllib.request.urlopen(scrape_req, timeout=20) as resp:
                return json.loads(resp.read()).get("data", {}).get("markdown", "")

        # Scrape homepage
        homepage_content = scrape_url(root_url)
        trimmed = f"[Homepage: {root_url}]\n{homepage_content[:2000]}"

        # Scrape key subpages in parallel — news/press removed to avoid stale articles
        subpages = ["/about", "/about-us", "/leadership", "/company"]
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_to_path = {
                executor.submit(scrape_url, root_url + path): path
                for path in subpages
            }
            for future in as_completed(future_to_path):
                path = future_to_path[future]
                try:
                    content = future.result()
                    if content and len(content) > 100:
                        trimmed += f"\n\n[Subpage: {path}]\n{content[:1500]}"
                except:
                    pass

        return trimmed

    except Exception as e:
        return f"[Website] Error scraping: {str(e)}"


# ─────────────────────────────────────────────
# 4. WIKIPEDIA — Free, no key (flagged as potentially outdated)
# ─────────────────────────────────────────────
def search_wikipedia(company_name):
    try:
        search_url = (
            f"https://en.wikipedia.org/api/rest_v1/page/summary/"
            f"{urllib.parse.quote(company_name.replace(' ', '_'))}"
        )
        req = urllib.request.Request(
            search_url,
            headers={"User-Agent": "TexasAM-Hackathon research@tamu.edu"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            extract = data.get("extract", "")
            if extract:
                return f"[Wikipedia] {data.get('title', company_name)}: {extract[:2000]}"
            return f"[Wikipedia] No article found for {company_name}"
    except Exception as e:
        return f"[Wikipedia] Error: {str(e)}"


# ─────────────────────────────────────────────
# 5. LINKEDIN — Via Tavily search (180 day limit)
# ─────────────────────────────────────────────
def search_linkedin(company_name):
    try:
        queries = [
            f"{company_name} site:linkedin.com/company",
            f"{company_name} employees industry headquarters linkedin",
        ]
        results = []
        for q in queries:
            payload = json.dumps({
                "api_key": TAVILY_KEY,
                "query": q,
                "search_depth": "basic",
                "max_results": 3,
                "days": 180
            }).encode()
            req = urllib.request.Request(
                "https://api.tavily.com/search",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
                for r in data.get("results", []):
                    results.append(f"[LinkedIn/Web] {r['title']}: {r['content'][:400]}")

        return "\n".join(results) if results else f"[LinkedIn] No results found for {company_name}"
    except Exception as e:
        return f"[LinkedIn] Error: {str(e)}"


# ─────────────────────────────────────────────
# MASTER RESEARCH FUNCTION — All sources in parallel
# ─────────────────────────────────────────────
def gather_all_research(company_name, company_url=None):
    sources = {
        "web":       lambda: search_tavily(company_name),
        "edgar":     lambda: search_edgar(company_name),
        "website":   lambda: find_and_scrape_website(company_name, company_url),
        "wikipedia": lambda: search_wikipedia(company_name),
        "linkedin":  lambda: search_linkedin(company_name),
    }

    results = {}
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_key = {executor.submit(fn): key for key, fn in sources.items()}
        for future in as_completed(future_to_key):
            key = future_to_key[future]
            try:
                results[key] = future.result()
            except Exception as e:
                results[key] = f"[{key}] Failed: {str(e)}"

    combined = f"""
=== WEB RESEARCH ===
{results.get('web', 'Unavailable')}

=== SEC EDGAR 10-K FILING ===
{results.get('edgar', 'Unavailable')}

=== COMPANY WEBSITE ===
{results.get('website', 'Unavailable')}

=== WIKIPEDIA (may contain outdated information — verify before using) ===
{results.get('wikipedia', 'Unavailable')}

=== LINKEDIN COMPANY DATA ===
{results.get('linkedin', 'Unavailable')}
""".strip()

    return combined


# ─────────────────────────────────────────────
# BEDROCK — Call Claude
# ─────────────────────────────────────────────
def call_claude(prompt):
    response = BEDROCK.invoke_model(
        modelId=MODEL_ID,
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": prompt}]
        })
    )
    return json.loads(response["body"].read())["content"][0]["text"]


# ─────────────────────────────────────────────
# DOCUMENT GENERATORS
# ─────────────────────────────────────────────
def generate_interviewer_brief(company_name, research):
    today = date.today().strftime("%B %d, %Y")
    prompt = f"""Today's date is {today}.

You are an expert business intelligence researcher helping Texas A&M faculty prepare for interviews with Texas businesses.

CRITICAL INSTRUCTIONS:
1. Use ONLY specific facts, numbers, names, and dates from the research provided below. Never make generic statements. Every claim must be grounded in the research.
2. HISTORICAL FACTS (founding dates, company origin stories, early expansion history) are stable and should be stated confidently without any uncertainty flag — these do not change.
3. OPERATIONAL FACTS that could have changed (store counts, employee numbers, revenue, leadership, partnerships) should be flagged with [VERIFY] if the source appears older than 6 months from today ({today}).
4. RECENT NEWS AND STORE OPENINGS should only be included if they are dated late 2025 or 2026. Do not include any store openings, expansions, or news items from 2024 or earlier.
5. Do not include current promotions, sales, or marketing offers — these are not relevant to a business intelligence interview.
6. If something is unknown, explicitly flag it as a knowledge gap rather than writing a vague sentence.

Based on this research about {company_name}:
{research}

Generate a professional INTERVIEWER BRIEF with these exact sections:

## Company Overview & Market Context
[2-3 paragraphs: what they do, market position, recent news from late 2025/2026 only, Texas presence. Use specific facts and dates. Historical facts stated confidently. Operational facts flagged with [VERIFY] if potentially outdated.]

## What We Think We Know
[Bullet list of 6-8 key facts — this gets sent to the interviewee to fact-check. Historical facts stated confidently. Operational/current facts flagged with [VERIFY] if the source is older than 6 months.]

## 8-10 Discovery Questions
[Open-ended, non-leading questions using best-practice interview technique. Each question should reference something specific from the research and include a 1-sentence rationale. Focus on strategy, culture, markets, and opportunities — not promotions or marketing.]

## Suggested Conversation Flow
[Stage 1: Opening (use "what did we get wrong?"), Stage 2: Core questions, Stage 3: Forward-looking]

## Key Knowledge Gaps to Explore
[3-5 specific areas where the research was thin or where [VERIFY] flags suggest the interview should confirm current reality]

Format this as a clean, professional document. Be specific to {company_name}, not generic."""
    return call_claude(prompt)


def generate_interviewee_packet(company_name, research):
    today = date.today().strftime("%B %d, %Y")
    prompt = f"""Today's date is {today}.

You are preparing a short, friendly pre-interview packet to send to a representative from {company_name} before a research interview with Texas A&M.

CRITICAL INSTRUCTIONS:
1. Use ONLY specific facts, numbers, names, and dates from the research provided below. Every claim must be grounded in the research.
2. HISTORICAL FACTS (founding dates, company origin stories, early expansion history) are stable — state them confidently without any uncertainty flag.
3. OPERATIONAL FACTS that could have changed (store counts, employee numbers, current initiatives) should be flagged with [please verify] in a friendly tone if the source appears older than 6 months from today ({today}).
4. RECENT NEWS AND STORE OPENINGS should only be included if they are dated late 2025 or 2026. Do not include any store openings, expansions, or news items from 2024 or earlier.
5. Do not include current promotions, sales, or marketing offers.
6. Keep the tone warm and collaborative — this is not an interrogation.

Based on this research:
{research}

Generate a 1-page PRE-INTERVIEW PACKET with these exact sections:

## What We Learned About {company_name}
[3-4 bullet points of SPECIFIC facts — written as "Here's what we think we know..." Historical facts stated confidently. Operational facts noted with [please verify] if potentially outdated.]

## We Want to Get This Right
[1 short paragraph asking them to correct anything wrong. Warm tone. Reference 1-2 specific things from the research to show you've done your homework.]

## 5-6 Questions We'd Like to Explore
[Open-ended, genuinely curious questions focused on strategy, culture, and markets. Reference specific research findings where natural. Number them.]

## Your Input Matters
[1 sentence inviting them to select which 2-3 questions interest them most]

Keep this concise, warm, and under 400 words total."""
    return call_claude(prompt)

# ─────────────────────────────────────────────
# LAMBDA HANDLER
# ─────────────────────────────────────────────
def lambda_handler(event, context):
    print("EVENT RECEIVED:", json.dumps(event))

    # Handle CORS preflight for Function URL
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": ""
        }

    body = json.loads(event.get("body", "{}"))
    print("BODY PARSED:", body)

    company_name = body.get("company_name", "").strip()
    company_url = body.get("company_url", None)

    print("COMPANY NAME:", company_name)
    print("COMPANY URL:", company_url)

    if not company_name:
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "company_name is required"})
        }

    if company_url:
        company_url = company_url.strip()
        if not company_url.startswith("http"):
            company_url = "https://" + company_url

    research = gather_all_research(company_name, company_url)
    interviewer_brief = generate_interviewer_brief(company_name, research)
    interviewee_packet = generate_interviewee_packet(company_name, research)

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        },
        "body": json.dumps({
            "company": company_name,
            "interviewer_brief": interviewer_brief,
            "interviewee_packet": interviewee_packet
        })
    }