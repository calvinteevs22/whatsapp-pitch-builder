# Debug Notes - Unifi Image Issue

## Key Findings from unifi.com.my/mobile
- Site uses Drupal CMS with Varnish cache
- Hero image is a background CSS image (not an img tag), likely not extractable
- Product images (Samsung Galaxy, Redmi, HONOR) are on the page
- Site has hotlink protection and CSP headers
- Many images may be lazy-loaded or CSS background images

## Root Cause of Broken Image
- The crawler likely extracted a URL that returns 404 or is hotlink-protected
- The first message image shows a blank white space = image URL exists but doesn't load
- Need to validate image URLs during crawl and fallback to stock images

## Speed Issues
- Deep crawl fetches multiple pages sequentially
- LLM call to structure products adds latency
- Main AI generation prompt is very long (journey coherence rules, etc.)
- Two LLM calls: one for product structuring, one for conversation generation
