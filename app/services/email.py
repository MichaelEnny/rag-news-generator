import html
import os

import markdown
import resend
from dotenv import load_dotenv

load_dotenv()

EMAIL_FROM = os.getenv("EMAIL_FROM")
EMAIL_TO = os.getenv("EMAIL_TO")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")


def send_email(subject: str, body_text: str, body_html: str = None, recipients: list = None):
    if not RESEND_API_KEY:
        raise ValueError("RESEND_API_KEY environment variable is not set")
    if not EMAIL_FROM:
        raise ValueError("EMAIL_FROM environment variable is not set")

    if recipients is None:
        if not EMAIL_TO:
            raise ValueError("EMAIL_TO environment variable is not set")
        recipients = [EMAIL_TO]

    recipients = [r for r in recipients if r is not None]
    if not recipients:
        raise ValueError("No valid recipients provided")

    resend.api_key = RESEND_API_KEY

    params: resend.Emails.SendParams = {
        "from": EMAIL_FROM,
        "to": recipients,
        "subject": subject,
        "text": body_text,
    }
    if body_html:
        params["html"] = body_html

    resend.Emails.send(params)


def markdown_to_html(markdown_text: str) -> str:
    rendered_html = markdown.markdown(markdown_text, extensions=["extra", "nl2br"])
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }}
        h2 {{
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
            margin-top: 24px;
            margin-bottom: 8px;
            line-height: 1.4;
        }}
        h3 {{
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            margin-top: 20px;
            margin-bottom: 8px;
            line-height: 1.4;
        }}
        p {{
            margin: 8px 0;
            color: #4a4a4a;
        }}
        strong {{
            font-weight: 600;
            color: #1a1a1a;
        }}
        em {{
            font-style: italic;
            color: #666;
        }}
        a {{
            color: #0066cc;
            text-decoration: none;
            font-weight: 500;
        }}
        a:hover {{
            text-decoration: underline;
        }}
        hr {{
            border: none;
            border-top: 1px solid #e5e5e5;
            margin: 20px 0;
        }}
        .greeting {{
            font-size: 16px;
            font-weight: 500;
            color: #1a1a1a;
            margin-bottom: 12px;
        }}
        .introduction {{
            color: #4a4a4a;
            margin-bottom: 20px;
        }}
        .article-link {{
            display: inline-block;
            margin-top: 8px;
            color: #0066cc;
            font-size: 14px;
        }}
    </style>
</head>
<body>
{rendered_html}
</body>
</html>"""


def digest_to_html(digest_response) -> str:
    from app.agent.email_agent import EmailDigestResponse

    if not isinstance(digest_response, EmailDigestResponse):
        if hasattr(digest_response, "to_markdown"):
            return markdown_to_html(digest_response.to_markdown())
        return markdown_to_html(str(digest_response))

    html_parts = []
    greeting_html = markdown.markdown(
        digest_response.introduction.greeting, extensions=["extra", "nl2br"]
    )
    introduction_html = markdown.markdown(
        digest_response.introduction.introduction, extensions=["extra", "nl2br"]
    )
    html_parts.append(f'<div class="greeting">{greeting_html}</div>')
    html_parts.append(f'<div class="introduction">{introduction_html}</div>')
    html_parts.append("<hr>")

    for article in digest_response.articles:
        html_parts.append(f"<h3>{html.escape(article.title)}</h3>")
        summary_html = markdown.markdown(article.summary, extensions=["extra", "nl2br"])
        html_parts.append(f"<div>{summary_html}</div>")
        html_parts.append(
            f'<p><a href="{html.escape(article.url)}" class="article-link">Read more -&gt;</a></p>'
        )
        html_parts.append("<hr>")

    html_content = "\n".join(html_parts)

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }}
        h3 {{
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            margin-top: 20px;
            margin-bottom: 8px;
            line-height: 1.4;
        }}
        p {{
            margin: 8px 0;
            color: #4a4a4a;
        }}
        strong {{
            font-weight: 600;
            color: #1a1a1a;
        }}
        em {{
            font-style: italic;
            color: #666;
        }}
        a {{
            color: #0066cc;
            text-decoration: none;
            font-weight: 500;
        }}
        a:hover {{
            text-decoration: underline;
        }}
        hr {{
            border: none;
            border-top: 1px solid #e5e5e5;
            margin: 20px 0;
        }}
        .greeting {{
            font-size: 16px;
            font-weight: 500;
            color: #1a1a1a;
            margin-bottom: 12px;
        }}
        .introduction {{
            color: #4a4a4a;
            margin-bottom: 20px;
        }}
        .article-link {{
            display: inline-block;
            margin-top: 8px;
            color: #0066cc;
            font-size: 14px;
        }}
        .greeting p {{
            margin: 0;
        }}
        .introduction p {{
            margin: 0;
        }}
        div {{
            margin: 8px 0;
            color: #4a4a4a;
        }}
        div p {{
            margin: 4px 0;
        }}
    </style>
</head>
<body>
{html_content}
</body>
</html>"""


def send_email_to_self(subject: str, body: str):
    if not EMAIL_TO:
        raise ValueError("EMAIL_TO environment variable is not set. Please set it in your .env file.")
    send_email(subject, body, recipients=[EMAIL_TO])


if __name__ == "__main__":
    send_email_to_self("Test from Python", "Hello from my script.")
